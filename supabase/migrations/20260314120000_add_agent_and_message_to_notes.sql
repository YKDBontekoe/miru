-- Migration: add_agent_and_message_to_notes
-- Generated: 2026-03-14T12:00:00.000000+00:00
-- Type: incremental

ALTER TABLE "notes" ADD COLUMN "agent_id" UUID REFERENCES "agents" ("id") ON DELETE SET NULL;
ALTER TABLE "notes" ADD COLUMN "origin_message_id" UUID REFERENCES "chat_messages" ("id") ON DELETE SET NULL;
ALTER TABLE "notes" ADD COLUMN "origin_context" TEXT;

CREATE INDEX IF NOT EXISTS "idx_notes_agent_id" ON "notes" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_notes_origin_message_id" ON "notes" ("origin_message_id");
