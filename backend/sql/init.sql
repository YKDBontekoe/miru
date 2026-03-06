-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memories table: stores user memories with embeddings
CREATE TABLE IF NOT EXISTS memories (
    id          BIGSERIAL PRIMARY KEY,
    content     TEXT        NOT NULL,
    embedding   vector(1024) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS memories_embedding_idx
    ON memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
