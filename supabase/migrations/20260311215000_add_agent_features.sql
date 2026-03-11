-- Migration: Add agent mood, message count, and agent relationships

-- 1. Add new columns to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS mood text NOT NULL DEFAULT 'Neutral';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS message_count integer NOT NULL DEFAULT 0;

-- 2. Create agent_relationships table
CREATE TABLE public.agent_relationships (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    agent_id       uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    target_agent_id uuid       NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    relationship_type text     NOT NULL,
    description    text        NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (id),
    CONSTRAINT chk_different_agents CHECK (agent_id != target_agent_id),
    CONSTRAINT unique_relationship UNIQUE (agent_id, target_agent_id)
);

CREATE INDEX idx_agent_relationships_agent_id ON public.agent_relationships(agent_id);

-- 3. Enable Row Level Security
ALTER TABLE public.agent_relationships ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for agent_relationships
-- Users can only see/modify relationships where the source agent belongs to them.
CREATE POLICY "agent_relationships_select_own"
    ON public.agent_relationships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            WHERE a.id = agent_relationships.agent_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "agent_relationships_insert_own"
    ON public.agent_relationships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agents a
            WHERE a.id = agent_relationships.agent_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "agent_relationships_update_own"
    ON public.agent_relationships FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            WHERE a.id = agent_relationships.agent_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "agent_relationships_delete_own"
    ON public.agent_relationships FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            WHERE a.id = agent_relationships.agent_id AND a.user_id = auth.uid()
        )
    );
