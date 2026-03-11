-- Migration: Use halfvec for 2048-dimension embeddings to bypass 2000-dimension index limit
--
-- The standard `vector` type in pgvector has a limit of 2000 dimensions for HNSW/IVFFlat indexes.
-- By using `halfvec` (2-byte floats), we can index up to 4000 dimensions while saving 50% storage
-- with negligible loss in retrieval recall.

-- Step 1: Drop the problematic index and function from the previous schema
DROP INDEX IF EXISTS public.memories_embedding_idx;

-- Drop all potential overloaded versions of match_memories to ensure a clean slate
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int);
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, text);
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, text, text, text);
DROP FUNCTION IF EXISTS public.match_memories(vector(2048), float, int, text, text, text);
DROP FUNCTION IF EXISTS public.match_memories(halfvec, float, int, text, text, text);
DROP FUNCTION IF EXISTS public.match_memories(halfvec(2048), float, int, text, text, text);

-- Step 2: Clear all existing memories (incompatible dimensions/types)
TRUNCATE public.memories;

-- Step 3: Convert the column to halfvec(2048)
-- We use USING to cast the existing vector (which is empty anyway due to the TRUNCATE above)
ALTER TABLE public.memories
    ALTER COLUMN embedding TYPE halfvec(2048);

-- Step 4: Create the HNSW index using halfvec_cosine_ops
CREATE INDEX memories_embedding_idx
    ON public.memories
    USING hnsw (embedding halfvec_cosine_ops);

-- Step 5: Recreate the match_memories RPC to accept halfvec(2048)
-- This allows the application to continue passing vectors which will be implicitly cast
CREATE OR REPLACE FUNCTION public.match_memories(
    query_embedding halfvec(2048),
    match_threshold double precision,
    match_count     integer,
    p_user_id       text DEFAULT NULL,
    p_agent_id      text DEFAULT NULL,
    p_room_id       text DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, similarity double precision)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id, 
        m.content,
        (1 - (m.embedding <=> query_embedding))::double precision AS similarity
    FROM public.memories m
    WHERE 1 - (m.embedding <=> query_embedding) > match_threshold
      AND (p_user_id  IS NULL OR m.user_id  = p_user_id::uuid)
      AND (p_agent_id IS NULL OR m.agent_id = p_agent_id::uuid)
      AND (p_room_id  IS NULL OR m.room_id  = p_room_id::uuid)
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
