-- Migration: feature_enhancements
-- Generated: 2026-03-28T22:11:16.360586+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS "personality_history" JSONB NOT NULL;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "recurrence_rule" VARCHAR(50);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "recurrence_end_date" TIMESTAMPTZ;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "linked_task_id" UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "recurrence_rule" VARCHAR(50);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "recurrence_end_date" TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "calendar_event_id" UUID;
