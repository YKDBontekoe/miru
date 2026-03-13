-- Migration: add_passkeys
-- Generated manually to be incremental

-- Schema ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "passkeys" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "credential_id" VARCHAR(512) NOT NULL,
    "public_key" TEXT NOT NULL,
    "sign_count" INT NOT NULL DEFAULT 0,
    "device_name" VARCHAR(255),
    "transports" JSONB NOT NULL,
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_passkeys_user_id_6fd10a" ON "passkeys" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_passkeys_credent_cfa3da" ON "passkeys" ("credential_id");
COMMENT ON TABLE "passkeys" IS 'WebAuthn passkeys for passwordless login.';

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS passkeys_owner_all ON public.passkeys;
CREATE POLICY passkeys_owner_all ON public.passkeys FOR ALL USING (auth.uid() = user_id);
