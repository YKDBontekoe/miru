-- Migration: Enhance agents with capabilities, goals, integrations, and richer profiles
-- Supports the new agentic agent creation wizard and future integration connections
-- (e.g. Spotify, Discord, calendar, etc.)

-- ---------------------------------------------------------------------------
-- 1. Add new columns to agents table
-- ---------------------------------------------------------------------------

ALTER TABLE public.agents
    ADD COLUMN description    text,
    ADD COLUMN goals          jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN capabilities   jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN integrations   jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN system_prompt  text,
    ADD COLUMN status         text NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.agents.description IS 'A short human-readable description of what this agent does';
COMMENT ON COLUMN public.agents.goals IS 'JSON array of goal strings the agent works towards';
COMMENT ON COLUMN public.agents.capabilities IS 'JSON array of capability identifiers (e.g. "web_search", "code_review")';
COMMENT ON COLUMN public.agents.integrations IS 'JSON array of integration objects: [{"type": "spotify", "enabled": true, "config": {...}}]';
COMMENT ON COLUMN public.agents.system_prompt IS 'Auto-generated or user-overridden system prompt composed from personality + goals + capabilities';
COMMENT ON COLUMN public.agents.status IS 'Agent status: active, disabled, draft';

-- ---------------------------------------------------------------------------
-- 2. Create agent_integrations table for future OAuth-based connections
-- ---------------------------------------------------------------------------

CREATE TABLE public.agent_integrations (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    agent_id       uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type text      NOT NULL,  -- e.g. 'spotify', 'discord', 'google_calendar'
    display_name   text        NOT NULL,
    enabled        boolean     NOT NULL DEFAULT true,
    config         jsonb       NOT NULL DEFAULT '{}'::jsonb,
    credentials    jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- encrypted OAuth tokens etc.
    connected_at   timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (id),
    UNIQUE (agent_id, integration_type)
);

CREATE INDEX idx_agent_integrations_agent_id ON public.agent_integrations(agent_id);
CREATE INDEX idx_agent_integrations_user_id ON public.agent_integrations(user_id);

COMMENT ON TABLE public.agent_integrations IS 'Tracks external service connections (Spotify, Discord, etc.) per agent';
COMMENT ON COLUMN public.agent_integrations.integration_type IS 'Service identifier: spotify, discord, google_calendar, github, slack, notion, etc.';
COMMENT ON COLUMN public.agent_integrations.config IS 'Non-sensitive integration config (e.g. default playlist, channel ID)';
COMMENT ON COLUMN public.agent_integrations.credentials IS 'Encrypted OAuth tokens — never expose to client';

-- ---------------------------------------------------------------------------
-- 3. Enable RLS on agent_integrations
-- ---------------------------------------------------------------------------

ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_integrations_select_own"
    ON public.agent_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "agent_integrations_insert_own"
    ON public.agent_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_integrations_update_own"
    ON public.agent_integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "agent_integrations_delete_own"
    ON public.agent_integrations FOR DELETE
    USING (auth.uid() = user_id);
