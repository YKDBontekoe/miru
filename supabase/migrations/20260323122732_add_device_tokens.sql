-- Migration: add_device_tokens
-- Generated: 2026-03-23T12:27:32.328014+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

-- New table: device_tokens
CREATE TABLE IF NOT EXISTS "device_tokens" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL UNIQUE,
    "platform" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS "idx_device_toke_token_667234" ON "device_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_device_toke_user_id_9331d6" ON "device_tokens" ("user_id");

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS device_tokens_owner_all ON public.device_tokens;
CREATE POLICY device_tokens_owner_all ON public.device_tokens FOR ALL USING (auth.uid() = user_id);
