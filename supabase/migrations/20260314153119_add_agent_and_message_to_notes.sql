-- Migration: add_agent_and_message_to_notes
-- Generated: 2026-03-14T15:31:19.388624+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "agent_id_id" UUID REFERENCES "agents" ("id") ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "origin_message_id_id" UUID REFERENCES "chat_messages" ("id") ON DELETE SET NULL;
-- Removed column 'agent_id' from notes
-- ALTER TABLE public.notes DROP COLUMN IF EXISTS "agent_id";
-- Uncomment the line above to apply this destructive change.
-- Removed column 'origin_message_id' from notes
-- ALTER TABLE public.notes DROP COLUMN IF EXISTS "origin_message_id";
-- Uncomment the line above to apply this destructive change.
CREATE INDEX IF NOT EXISTS "idx_notes_agent_i_04e6df" ON "notes" ("agent_id_id");
CREATE INDEX IF NOT EXISTS "idx_notes_origin__daa6a1" ON "notes" ("origin_message_id_id");
-- Removed index 'idx_notes_agent_i_72e862'
-- DROP INDEX IF EXISTS "idx_notes_agent_i_72e862";
-- Uncomment the line above to apply this destructive change.
-- Removed index 'idx_notes_origin__be1941'
-- DROP INDEX IF EXISTS "idx_notes_origin__be1941";
-- Uncomment the line above to apply this destructive change.

-- Functions & Triggers --------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger AS $$
            BEGIN
              INSERT INTO public.profiles (id, display_name, avatar_url)
              VALUES (
                new.id,
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'avatar_url'
              );
              RETURN new;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agents_owner_all ON public.agents;
CREATE POLICY agents_owner_all ON public.agents FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS capabilities_select_all ON public.capabilities;
CREATE POLICY capabilities_select_all ON public.capabilities FOR SELECT USING (true);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS integrations_select_all ON public.integrations;
CREATE POLICY integrations_select_all ON public.integrations FOR SELECT USING (true);
ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_integrations_owner_all ON public.agent_integrations;
CREATE POLICY agent_integrations_owner_all ON public.agent_integrations FOR ALL USING (EXISTS (SELECT 1 FROM agents WHERE id = agent_id AND user_id = auth.uid()));
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_templates_select_all ON public.agent_templates;
CREATE POLICY agent_templates_select_all ON public.agent_templates FOR SELECT USING (true);
ALTER TABLE public.user_agent_affinity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_agent_affinity_owner ON public.user_agent_affinity;
CREATE POLICY user_agent_affinity_owner ON public.user_agent_affinity FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_action_logs_owner_select ON public.agent_action_logs;
CREATE POLICY agent_action_logs_owner_select ON public.agent_action_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS agent_action_logs_owner_insert ON public.agent_action_logs;
CREATE POLICY agent_action_logs_owner_insert ON public.agent_action_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS passkeys_owner_all ON public.passkeys;
CREATE POLICY passkeys_owner_all ON public.passkeys FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_rooms_owner_all ON public.chat_rooms;
CREATE POLICY chat_rooms_owner_all ON public.chat_rooms FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_owner_select ON public.chat_messages;
CREATE POLICY chat_messages_owner_select ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_messages_owner_insert ON public.chat_messages;
CREATE POLICY chat_messages_owner_insert ON public.chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_messages_owner_update ON public.chat_messages;
CREATE POLICY chat_messages_owner_update ON public.chat_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS chat_messages_owner_delete ON public.chat_messages;
CREATE POLICY chat_messages_owner_delete ON public.chat_messages FOR DELETE USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_collections_owner_all ON public.memory_collections;
CREATE POLICY memory_collections_owner_all ON public.memory_collections FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memories_owner_all ON public.memories;
CREATE POLICY memories_owner_all ON public.memories FOR ALL USING (auth.uid() = user_id OR (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (SELECT 1 FROM agents WHERE id = memories.agent_id AND user_id = auth.uid())));
ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_relationships_owner_select ON public.memory_relationships;
CREATE POLICY memory_relationships_owner_select ON public.memory_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS memory_relationships_owner_insert ON public.memory_relationships;
CREATE POLICY memory_relationships_owner_insert ON public.memory_relationships FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS memory_relationships_owner_delete ON public.memory_relationships;
CREATE POLICY memory_relationships_owner_delete ON public.memory_relationships FOR DELETE USING (EXISTS (SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()));
ALTER TABLE public.memory_graph_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_graph_nodes_owner ON public.memory_graph_nodes;
CREATE POLICY memory_graph_nodes_owner ON public.memory_graph_nodes FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.memory_graph_edges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_graph_edges_owner ON public.memory_graph_edges;
CREATE POLICY memory_graph_edges_owner ON public.memory_graph_edges FOR ALL USING (EXISTS (SELECT 1 FROM memory_graph_nodes WHERE id = source_node_id AND user_id = auth.uid()));
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_tools_select ON public.agent_tools;
CREATE POLICY agent_tools_select ON public.agent_tools FOR SELECT USING (is_public = true OR auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS agent_tools_insert ON public.agent_tools;
CREATE POLICY agent_tools_insert ON public.agent_tools FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS agent_tools_update ON public.agent_tools;
CREATE POLICY agent_tools_update ON public.agent_tools FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS agent_tools_delete ON public.agent_tools;
CREATE POLICY agent_tools_delete ON public.agent_tools FOR DELETE USING (auth.uid() = user_id);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_owner_all ON public.tasks;
CREATE POLICY tasks_owner_all ON public.tasks FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notes_owner_all ON public.notes;
CREATE POLICY notes_owner_all ON public.notes FOR ALL USING (auth.uid() = user_id);
