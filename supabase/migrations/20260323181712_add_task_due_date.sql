-- Migration: add_task_due_date
-- Generated: 2026-03-23T18:17:12.347229+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMPTZ;
