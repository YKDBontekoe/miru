-- Migration: add_audit_log
-- Generated: 2026-03-25T12:44:25.514049+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

-- New table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id_f7db5c" ON "audit_logs" ("user_id");

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS audit_logs_select_own ON public.audit_logs;
CREATE POLICY audit_logs_select_own ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
