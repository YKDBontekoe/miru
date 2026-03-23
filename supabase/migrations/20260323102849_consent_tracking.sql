-- Migration: consent_tracking
-- Generated: 2026-03-23T10:28:49.081871+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "marketing_consent" BOOL NOT NULL DEFAULT False;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "data_processing_consent" BOOL NOT NULL DEFAULT False;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMPTZ;
