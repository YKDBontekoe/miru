-- Migration: change memories.id from bigint sequence to uuid.
--
-- The original schema used a bigint sequence, but the application expects
-- uuid primary keys. This caused every insert to fail with:
--   "invalid input syntax for type bigint: <uuid>"
--
-- We drop and recreate the table (safe — no production data at this point)
-- and update the match_memories() RPC to return uuid instead of bigint.
-- gen_random_uuid() is available on all Supabase projects without any extra
-- extension.

-- Drop old table and sequence
DROP TABLE IF EXISTS memories CASCADE;
DROP SEQUENCE IF EXISTS memories_id_seq;

-- Recreate table with uuid primary key
CREATE TABLE memories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Recreate IVFFlat index for vector similarity search
CREATE INDEX memories_embedding_idx
    ON memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Recreate RPC with uuid return type
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE(
    id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        memories.id,
        memories.content,
        1 - (memories.embedding <=> query_embedding) AS similarity
    FROM memories
    WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
