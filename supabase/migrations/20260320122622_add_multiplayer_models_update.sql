-- Migration: add_multiplayer_models_update
-- Generated: 2026-03-20T12:26:22.111348+00:00
-- Type: incremental


-- Row Level Security ----------------------------------------------------

DROP POLICY IF EXISTS chat_rooms_member_select ON public.chat_rooms;
CREATE POLICY chat_rooms_member_select ON public.chat_rooms FOR SELECT USING (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_rooms_member_update ON public.chat_rooms;
CREATE POLICY chat_rooms_member_update ON public.chat_rooms FOR UPDATE USING (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS room_invitations_select ON public.room_invitations;
CREATE POLICY room_invitations_select ON public.room_invitations FOR SELECT USING (inviter_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (SELECT 1 FROM agents WHERE id = activity_logs.agent_id AND user_id = auth.uid())));
DROP POLICY IF EXISTS memories_owner_all ON public.memories;
CREATE POLICY memories_owner_all ON public.memories FOR ALL USING (auth.uid() = user_id OR (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (SELECT 1 FROM agents WHERE id = memories.agent_id AND user_id = auth.uid())));
DROP POLICY IF EXISTS memories_room_select ON public.memories;
CREATE POLICY memories_room_select ON public.memories FOR SELECT USING (room_id IS NOT NULL AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = memories.room_id AND user_id = auth.uid()));

-- Custom Indexes --------------------------------------------------------

CREATE INDEX IF NOT EXISTS activity_logs_room_created_idx ON public.activity_logs (room_id, created_at DESC);
