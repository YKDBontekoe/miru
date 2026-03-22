-- Migration: add_consent_tracking
-- Generated: 2026-03-22T10:22:59.611307+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "marketing_consent" BOOL NOT NULL DEFAULT False;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "data_processing_consent" BOOL NOT NULL DEFAULT False;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMPTZ;
