-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory collections table
CREATE TABLE IF NOT EXISTS memory_collections (
    id          UUID         PRIMARY KEY,
    user_id     UUID         NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Memories table: stores user memories with embeddings.
-- Embedding dimension is 1536 to match openai/text-embedding-3-small via OpenRouter.
CREATE TABLE IF NOT EXISTS memories (
    id          UUID         PRIMARY KEY,
    user_id     UUID,
    agent_id    UUID,
    room_id     UUID,
    content     TEXT         NOT NULL,
    embedding   vector(1536) NOT NULL,
    meta        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    collection_id UUID REFERENCES memory_collections(id) ON DELETE SET NULL
);

-- IVFFlat index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS memories_embedding_idx
    ON memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- RPC function for vector similarity search
-- Run this in your Supabase SQL Editor to enable match_memories RPC
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_user_id uuid DEFAULT NULL,
    p_agent_id uuid DEFAULT NULL,
    p_room_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    agent_id uuid,
    room_id uuid,
    content text,
    embedding vector(1536),
    meta jsonb,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    collection_id uuid,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        memories.id,
        memories.user_id,
        memories.agent_id,
        memories.room_id,
        memories.content,
        memories.embedding,
        memories.meta,
        memories.created_at,
        memories.updated_at,
        memories.deleted_at,
        memories.collection_id,
        1 - (memories.embedding <=> query_embedding) AS similarity
    FROM memories
    WHERE (1 - (memories.embedding <=> query_embedding) > match_threshold)
      AND (p_user_id IS NULL OR memories.user_id = p_user_id)
      AND (p_agent_id IS NULL OR memories.agent_id = p_agent_id)
      AND (p_room_id IS NULL OR memories.room_id = p_room_id)
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
