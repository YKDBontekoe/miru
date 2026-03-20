-- Migration: add_multiplayer_models
-- Generated: 2026-03-20T11:06:59.520590+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

-- New table: activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "agent_id" UUID,
    "action_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "room_id" UUID REFERENCES "chat_rooms" ("id") ON DELETE CASCADE
);
-- New table: chat_room_members
CREATE TABLE IF NOT EXISTS "chat_room_members" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "room_id" UUID NOT NULL REFERENCES "chat_rooms" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_chat_room_m_room_id_0cc343" UNIQUE ("room_id", "user_id")
);
-- New table: room_invitations
CREATE TABLE IF NOT EXISTS "room_invitations" (
    "id" UUID NOT NULL PRIMARY KEY,
    "inviter_id" UUID NOT NULL,
    "email" VARCHAR(255),
    "token" VARCHAR(255) NOT NULL UNIQUE,
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "room_id" UUID NOT NULL REFERENCES "chat_rooms" ("id") ON DELETE CASCADE
);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "room_id" UUID REFERENCES "chat_rooms" ("id") ON DELETE CASCADE;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "room_id" UUID REFERENCES "chat_rooms" ("id") ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "room_id" UUID REFERENCES "chat_rooms" ("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "idx_activity_lo_agent_i_8cbeb4" ON "activity_logs" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_activity_lo_user_id_b3aede" ON "activity_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_ev_room_id_717155" ON "calendar_events" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_chat_room_m_user_id_2bf086" ON "chat_room_members" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notes_room_id_ceca8d" ON "notes" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_room_invita_inviter_b8eeec" ON "room_invitations" ("inviter_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_room_id_5cdfbc" ON "tasks" ("room_id");

-- Row Level Security ----------------------------------------------------

DROP POLICY IF EXISTS agents_room_member_select ON public.agents;
CREATE POLICY agents_room_member_select ON public.agents FOR SELECT USING (EXISTS (SELECT 1 FROM chat_room_agents cra JOIN chat_room_members crm ON cra.room_id = crm.room_id WHERE cra.agent_id = agents.id AND crm.user_id = auth.uid()));
DROP POLICY IF EXISTS chat_rooms_member_select ON public.chat_rooms;
CREATE POLICY chat_rooms_member_select ON public.chat_rooms FOR SELECT USING (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_rooms_member_update ON public.chat_rooms;
CREATE POLICY chat_rooms_member_update ON public.chat_rooms FOR UPDATE USING (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS chat_messages_member_select ON public.chat_messages;
CREATE POLICY chat_messages_member_select ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_messages_member_insert ON public.chat_messages;
CREATE POLICY chat_messages_member_insert ON public.chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member')));
DROP POLICY IF EXISTS chat_messages_owner_update ON public.chat_messages;
CREATE POLICY chat_messages_owner_update ON public.chat_messages FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS chat_messages_owner_delete ON public.chat_messages;
CREATE POLICY chat_messages_owner_delete ON public.chat_messages FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_room_members_select ON public.chat_room_members;
CREATE POLICY chat_room_members_select ON public.chat_room_members FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_room_members_manage ON public.chat_room_members;
CREATE POLICY chat_room_members_manage ON public.chat_room_members FOR ALL USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid() AND crm.role IN ('owner', 'admin')));
ALTER TABLE public.room_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS room_invitations_select ON public.room_invitations;
CREATE POLICY room_invitations_select ON public.room_invitations FOR SELECT USING (inviter_id = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = room_invitations.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS room_invitations_insert ON public.room_invitations;
CREATE POLICY room_invitations_insert ON public.room_invitations FOR INSERT WITH CHECK (inviter_id = auth.uid() AND (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = room_invitations.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))));
DROP POLICY IF EXISTS room_invitations_update ON public.room_invitations;
CREATE POLICY room_invitations_update ON public.room_invitations FOR UPDATE USING (inviter_id = auth.uid() OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activity_logs_select ON public.activity_logs;
CREATE POLICY activity_logs_select ON public.activity_logs FOR SELECT USING (user_id = auth.uid() OR (room_id IS NOT NULL AND (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = activity_logs.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()))));
DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS memories_owner_all ON public.memories;
CREATE POLICY memories_owner_all ON public.memories FOR ALL USING (auth.uid() = user_id OR (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (SELECT 1 FROM agents WHERE id = memories.agent_id AND user_id = auth.uid())) OR (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = memories.room_id AND user_id = auth.uid())));
DROP POLICY IF EXISTS tasks_room_select ON public.tasks;
CREATE POLICY tasks_room_select ON public.tasks FOR SELECT USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = tasks.room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS tasks_room_update ON public.tasks;
CREATE POLICY tasks_room_update ON public.tasks FOR UPDATE USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = tasks.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member')));
DROP POLICY IF EXISTS notes_room_select ON public.notes;
CREATE POLICY notes_room_select ON public.notes FOR SELECT USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = notes.room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS notes_room_update ON public.notes;
CREATE POLICY notes_room_update ON public.notes FOR UPDATE USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = notes.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member')));
DROP POLICY IF EXISTS calendar_events_room_select ON public.calendar_events;
CREATE POLICY calendar_events_room_select ON public.calendar_events FOR SELECT USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = calendar_events.room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS calendar_events_room_update ON public.calendar_events;
CREATE POLICY calendar_events_room_update ON public.calendar_events FOR UPDATE USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = calendar_events.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member')));
