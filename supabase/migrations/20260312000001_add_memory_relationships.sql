-- Migration: Add memory_relationships table and full-text search for memories

-- Create memory_relationships table
CREATE TABLE IF NOT EXISTS public.memory_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
    target_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
    relationship_type text NOT NULL DEFAULT 'RELATED_TO',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, target_id, relationship_type)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_memory_relationships_source_id ON public.memory_relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_memory_relationships_target_id ON public.memory_relationships(target_id);

-- Enable RLS for memory_relationships
ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for memory_relationships
-- A user can see relationships if they own both memories.
-- For simplicity, if they own the source memory, they can see/modify the relationship.
CREATE POLICY "memory_relationships_select_own"
    ON public.memory_relationships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memories m 
            WHERE m.id = memory_relationships.source_id 
            AND (
                m.user_id = auth.uid() OR
                (m.user_id IS NULL AND m.agent_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.agents a WHERE a.id = m.agent_id AND a.user_id = auth.uid()
                ))
            )
        )
    );

CREATE POLICY "memory_relationships_insert_own"
    ON public.memory_relationships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memories m 
            WHERE m.id = memory_relationships.source_id 
            AND (
                m.user_id = auth.uid() OR
                (m.user_id IS NULL AND m.agent_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.agents a WHERE a.id = m.agent_id AND a.user_id = auth.uid()
                ))
            )
        )
    );

CREATE POLICY "memory_relationships_delete_own"
    ON public.memory_relationships FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memories m 
            WHERE m.id = memory_relationships.source_id 
            AND (
                m.user_id = auth.uid() OR
                (m.user_id IS NULL AND m.agent_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.agents a WHERE a.id = m.agent_id AND a.user_id = auth.uid()
                ))
            )
        )
    );

-- Add full-text search support for memories
-- 1. Create a generated column for search
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS fts tsvector 
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- 2. Create GIN index for search
CREATE INDEX IF NOT EXISTS idx_memories_fts ON public.memories USING GIN(fts);
