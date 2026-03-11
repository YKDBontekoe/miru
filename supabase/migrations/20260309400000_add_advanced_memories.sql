-- Migration: Add advanced multi-layered memories
-- 1. Add agent_id and room_id to memories table
-- 2. Update match_memories RPC function to filter by user_id, agent_id, and room_id

ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE;

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_agent_id ON public.memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_room_id ON public.memories(room_id);

-- Enable RLS for memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to be safe)
DROP POLICY IF EXISTS "memories_select_own" ON public.memories;
DROP POLICY IF EXISTS "memories_insert_own" ON public.memories;
DROP POLICY IF EXISTS "memories_update_own" ON public.memories;
DROP POLICY IF EXISTS "memories_delete_own" ON public.memories;

-- Policies for memories
CREATE POLICY "memories_select_own"
    ON public.memories FOR SELECT
    USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.agents WHERE id = memories.agent_id AND user_id = auth.uid()
        )) OR
        (user_id IS NULL AND room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_rooms WHERE id = memories.room_id AND user_id = auth.uid()
        ))
    );

CREATE POLICY "memories_insert_own"
    ON public.memories FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.agents WHERE id = memories.agent_id AND user_id = auth.uid()
        )) OR
        (user_id IS NULL AND room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_rooms WHERE id = memories.room_id AND user_id = auth.uid()
        ))
    );

CREATE POLICY "memories_update_own"
    ON public.memories FOR UPDATE
    USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.agents WHERE id = memories.agent_id AND user_id = auth.uid()
        )) OR
        (user_id IS NULL AND room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_rooms WHERE id = memories.room_id AND user_id = auth.uid()
        ))
    );

CREATE POLICY "memories_delete_own"
    ON public.memories FOR DELETE
    USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.agents WHERE id = memories.agent_id AND user_id = auth.uid()
        )) OR
        (user_id IS NULL AND room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_rooms WHERE id = memories.room_id AND user_id = auth.uid()
        ))
    );

-- We need to drop the old match_memories function.
-- Looking at backend/app/memory.py, it was called with parameters:
-- query_embedding, match_threshold, match_count, and an optional p_user_id.
-- Supabase functions can be overloaded, so let's drop potential variants.

DROP FUNCTION IF EXISTS public.match_memories(vector, float, int);
DROP FUNCTION IF EXISTS public.match_memories(vector, float, int, text);

-- Recreate RPC with optional filters
CREATE FUNCTION public.match_memories(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_user_id text DEFAULT NULL,
    p_agent_id text DEFAULT NULL,
    p_room_id text DEFAULT NULL
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
    FROM public.memories
    WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
      AND (p_user_id IS NULL OR memories.user_id = p_user_id::uuid)
      AND (p_agent_id IS NULL OR memories.agent_id = p_agent_id::uuid)
      AND (p_room_id IS NULL OR memories.room_id = p_room_id::uuid)
    ORDER BY memories.embedding <=> query_embedding DESC
    LIMIT match_count;
END;
$$;
