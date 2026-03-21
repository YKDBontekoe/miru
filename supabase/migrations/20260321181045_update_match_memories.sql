-- RPC function for vector similarity search
-- Update match_memories RPC to handle optional parameters
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_user_id uuid DEFAULT NULL,
    p_agent_id uuid DEFAULT NULL,
    p_room_id uuid DEFAULT NULL
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
      AND (p_user_id IS NULL OR memories.user_id = p_user_id)
      AND (p_agent_id IS NULL OR memories.agent_id = p_agent_id)
      AND (p_room_id IS NULL OR memories.room_id = p_room_id)
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
