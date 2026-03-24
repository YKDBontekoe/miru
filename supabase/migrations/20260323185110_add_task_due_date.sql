-- Migration: add_task_due_date
-- Generated: 2026-03-23T18:51:10.450240+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMPTZ;
