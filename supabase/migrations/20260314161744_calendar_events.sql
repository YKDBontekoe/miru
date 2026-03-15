-- Migration: calendar_events
-- Generated: 2026-03-14T16:17:44.348221+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

-- New table: calendar_events
CREATE TABLE IF NOT EXISTS "calendar_events" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "origin_context" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "is_all_day" BOOL NOT NULL DEFAULT False,
    "location" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "agent_id" UUID REFERENCES "agents" ("id") ON DELETE SET NULL,
    "origin_message_id" UUID REFERENCES "chat_messages" ("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_calendar_ev_agent_i_ca76fe" ON "calendar_events" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_ev_origin__532920" ON "calendar_events" ("origin_message_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_ev_user_id_499dc5" ON "calendar_events" ("user_id");

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_events_owner_all ON public.calendar_events;
CREATE POLICY calendar_events_owner_all ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
