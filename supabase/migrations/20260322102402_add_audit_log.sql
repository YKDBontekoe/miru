-- Migration: add_audit_log
-- Generated: 2026-03-22T10:24:02.871773+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

-- New table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "endpoint" VARCHAR(500) NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id_f7db5c" ON "audit_logs" ("user_id");

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_owner_select ON public.audit_logs;
CREATE POLICY audit_logs_owner_select ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS audit_logs_insert_all ON public.audit_logs;
CREATE POLICY audit_logs_insert_all ON public.audit_logs FOR INSERT WITH CHECK (true);
