-- Migration: add_agent_and_message_to_notes
-- Generated: 2026-03-14T15:50:24.701130+00:00
-- Type: incremental


-- Schema changes --------------------------------------------------------

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "agent_id" UUID REFERENCES "agents" ("id") ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "origin_message_id" UUID REFERENCES "chat_messages" ("id") ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "origin_context" TEXT;

CREATE INDEX IF NOT EXISTS "idx_notes_agent_id" ON "notes" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_notes_origin_message_id" ON "notes" ("origin_message_id");
