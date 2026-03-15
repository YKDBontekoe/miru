-- Migration: calendar_events_check
-- Generated: 2026-03-15T11:22:29.770565+00:00
-- Type: incremental


-- Table Constraints / CHECKs ----------------------------------------------------

ALTER TABLE public.calendar_events ADD CONSTRAINT check_end_after_start CHECK (end_time > start_time);

-- No structural schema changes detected.
-- This migration contains only policy / function updates.
