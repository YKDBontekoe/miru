-- Migration: Resize embedding column from vector(1536) to vector(2048)
--
-- The embedding model was changed to one that produces 2048-dimensional vectors
-- (e.g. openai/text-embedding-3-large). This migration resizes the memories.embedding
-- column and rebuilds the match_memories RPC to match the new dimension.
--
-- NOTE: This drops all existing memory rows because pgvector does not support
-- ALTER COLUMN ... TYPE on populated vector columns. Existing embeddings at
-- 1536 dimensions are incompatible with the new dimension anyway.

-- Step 1: Drop dependent objects (index, RPC function, column)
DROP INDEX IF EXISTS public.memories_embedding_idx;

DROP FUNCTION IF EXISTS public.match_memories(vector, float, int);
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, uuid);
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, text);
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, text, text, text);

-- Step 2: Clear all existing memories (incompatible dimensions)
TRUNCATE public.memories;

-- Step 3: Resize the column
ALTER TABLE public.memories
    ALTER COLUMN embedding TYPE vector(2048);

-- Step 4: Recreate the IVFFlat index for the new dimension
CREATE INDEX memories_embedding_idx
    ON public.memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Step 5: Recreate the match_memories RPC with vector(2048) and all three optional filters
CREATE FUNCTION public.match_memories(
    query_embedding vector(2048),
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
