-- Initial migration: create memories table with pgvector support

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create sequence for id column
CREATE SEQUENCE IF NOT EXISTS memories_id_seq START 1;

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
    id bigint NOT NULL DEFAULT nextval('memories_id_seq'),
    content text NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create IVFFlat index for vector similarity search
CREATE INDEX IF NOT EXISTS memories_embedding_idx
    ON memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Create RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE(
    id bigint,
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
