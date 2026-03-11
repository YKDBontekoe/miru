-- Add relevance_score and last_accessed_at to memories
ALTER TABLE memories ADD COLUMN relevance_score REAL DEFAULT 1.0;
ALTER TABLE memories ADD COLUMN last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing memories
UPDATE memories SET relevance_score = 1.0, last_accessed_at = created_at WHERE relevance_score IS NULL;

-- Function to decay memories over time
CREATE OR REPLACE FUNCTION decay_memories(decay_factor real DEFAULT 0.95)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Decay relevance_score for memories that haven't been accessed recently
  -- Apply exponential decay based on days since last access
  UPDATE memories
  SET relevance_score = GREATEST(0.01, relevance_score * power(decay_factor, extract(epoch from (now() - last_accessed_at)) / 86400));

  -- Delete memories that have decayed completely
  DELETE FROM memories WHERE relevance_score < 0.1;
END;
$$;

-- Replace match_memories to update last_accessed_at
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding halfvec(2048),
  match_threshold float,
  match_count int,
  p_user_id uuid DEFAULT NULL,
  p_agent_id uuid DEFAULT NULL,
  p_room_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  relevance_score real
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_results RECORD;
BEGIN
  -- We return the exact same schema, but update last_accessed_at for returned rows.
  FOR v_results IN
    SELECT
      m.id,
      m.content,
      (1 - (m.embedding <=> query_embedding)) AS similarity,
      m.relevance_score
    FROM memories m
    WHERE (1 - (m.embedding <=> query_embedding)) > match_threshold
      AND (p_user_id IS NULL OR m.user_id = p_user_id)
      AND (p_agent_id IS NULL OR m.agent_id = p_agent_id)
      AND (p_room_id IS NULL OR m.room_id = p_room_id)
    ORDER BY (1 - (m.embedding <=> query_embedding)) DESC
    LIMIT match_count
  LOOP
    id := v_results.id;
    content := v_results.content;
    similarity := v_results.similarity;
    relevance_score := v_results.relevance_score;

    -- Update last accessed timestamp and bump relevance
    UPDATE memories
    SET last_accessed_at = NOW(),
        relevance_score = LEAST(1.0, COALESCE(memories.relevance_score, 1.0) + 0.1)
    WHERE memories.id = v_results.id;

    RETURN NEXT;
  END LOOP;
END;
$$;
