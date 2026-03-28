-- Feature enhancements: recurrence, task-event linking, personality history,
-- affinity API support, and agent action log policy additions.

-- ── tasks ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS recurrence_rule      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS recurrence_end_date  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS calendar_event_id    UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL;

-- ── calendar_events ───────────────────────────────────────────────────────────
ALTER TABLE public.calendar_events
    ADD COLUMN IF NOT EXISTS recurrence_rule      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS recurrence_end_date  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS linked_task_id       UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- ── agents ────────────────────────────────────────────────────────────────────
ALTER TABLE public.agents
    ADD COLUMN IF NOT EXISTS personality_history  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── agent_action_logs ─────────────────────────────────────────────────────────
-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;
