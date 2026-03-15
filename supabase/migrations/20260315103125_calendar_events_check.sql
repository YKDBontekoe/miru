-- Migration: calendar_events_check
-- Generated: 2026-03-15T10:31:25.954027+00:00
-- Type: incremental


-- Row Level Security ----------------------------------------------------

ALTER TABLE public.calendar_events ADD CONSTRAINT check_end_after_start CHECK (end_time >= start_time);

-- No structural schema changes detected.
-- This migration contains only policy / function updates.
