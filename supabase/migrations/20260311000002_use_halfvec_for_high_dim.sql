-- Migration: Use halfvec for 2048-dimension embeddings to bypass 2000-dimension index limit
--
-- The standard `vector` type in pgvector has a limit of 2000 dimensions for HNSW/IVFFlat indexes.
-- By using `halfvec` (2-byte floats), we can index up to 4000 dimensions while saving 50% storage
-- with negligible loss in retrieval recall.

-- Step 1: Drop the problematic index and function from the previous (failed) attempt
DROP INDEX IF EXISTS public.memories_embedding_idx;
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, text, text, text);
DROP FUNCTION IF EXISTS public.match_memories(vector(2048), float, int, text, text, text);

-- Step 2: Convert the column to halfvec(2048)
-- We use USING to cast the existing vector (which is empty anyway due to the TRUNCATE in the previous migration)
ALTER TABLE public.memories
    ALTER COLUMN embedding TYPE halfvec(2048);

-- Step 3: Create the HNSW index using halfvec_cosine_ops
CREATE INDEX memories_embedding_idx
    ON public.memories
    USING hnsw (embedding halfvec_cosine_ops);

-- Step 4: Recreate the match_memories RPC to accept halfvec(2048)
-- This allows the application to continue passing vectors which will be implicitly cast
CREATE OR REPLACE FUNCTION public.match_memories(
    query_embedding halfvec(2048),
    match_threshold float,
    match_count     int,
    p_user_id       text DEFAULT NULL,
    p_agent_id      text DEFAULT NULL,
    p_room_id       text DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT memories.id, memories.content,
           1 - (memories.embedding <=> query_embedding) AS similarity
    FROM public.memories
    WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
      AND (p_user_id  IS NULL OR memories.user_id  = p_user_id::uuid)
      AND (p_agent_id IS NULL OR memories.agent_id = p_agent_id::uuid)
      AND (p_room_id  IS NULL OR memories.room_id  = p_room_id::uuid)
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
