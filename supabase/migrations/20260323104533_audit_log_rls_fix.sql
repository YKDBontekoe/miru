-- Migration: audit_log_rls_fix
-- Generated: 2026-03-23T10:45:33.163766+00:00
-- Type: incremental


-- Row Level Security ----------------------------------------------------

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (true);

-- No structural schema changes detected.
-- This migration contains only policy / function updates.
