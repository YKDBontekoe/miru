-- Migration: match_memories_rpc_fix
-- Generated: 2026-03-30T19:06:48.125227+00:00
-- Type: incremental


-- Functions & Triggers --------------------------------------------------

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

-- No structural schema changes detected.
-- This migration contains only policy / function updates.
