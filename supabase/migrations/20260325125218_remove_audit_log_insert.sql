-- Migration: remove_audit_log_insert
-- Generated: 2026-03-25T12:52:18.155846+00:00
-- Type: incremental


-- No structural schema changes detected.
-- This migration contains only policy / function updates.

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
