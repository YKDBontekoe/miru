-- Migration: initial_schema
-- Generated: 2026-03-13T08:20:12.221493+00:00

CREATE EXTENSION IF NOT EXISTS vector;

-- Schema ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "agents" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "personality" TEXT NOT NULL,
    "description" TEXT,
    "avatar_url" VARCHAR(512),
    "system_prompt" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "mood" VARCHAR(50) NOT NULL DEFAULT 'Neutral',
    "goals" JSONB NOT NULL,
    "message_count" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "idx_agents_user_id_2779f1" ON "agents" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_agents_name_2c59dc" ON "agents" ("name");
COMMENT ON TABLE "agents" IS 'Database entity for Agents.';
CREATE TABLE IF NOT EXISTS "agent_templates" (
    "id" UUID NOT NULL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "goals" JSONB NOT NULL,
    "avatar_url" VARCHAR(512),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "agent_templates" IS 'Template for creating new agents.';
CREATE TABLE IF NOT EXISTS "capabilities" (
    "id" VARCHAR(50) NOT NULL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "capabilities" IS 'Database entity for Agent Capabilities.';
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" VARCHAR(50) NOT NULL PRIMARY KEY,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "config_schema" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "integrations" IS 'Database entity for external service definitions (e.g. Steam).';
CREATE TABLE IF NOT EXISTS "agent_integrations" (
    "id" UUID NOT NULL PRIMARY KEY,
    "enabled" BOOL NOT NULL DEFAULT True,
    "config" JSONB NOT NULL,
    "credentials" JSONB NOT NULL,
    "connected_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" UUID NOT NULL REFERENCES "agents" ("id") ON DELETE CASCADE,
    "integration_id" VARCHAR(50) NOT NULL REFERENCES "integrations" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_agent_integ_agent_i_4befdf" UNIQUE ("agent_id", "integration_id")
);
COMMENT ON TABLE "agent_integrations" IS 'Junction table for Agents and their specific service connections.';
CREATE TABLE IF NOT EXISTS "user_agent_affinity" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "affinity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trust_level" INT NOT NULL DEFAULT 1,
    "milestones" JSONB NOT NULL,
    "last_interaction_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" UUID NOT NULL REFERENCES "agents" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_user_agent__user_id_2ad232" UNIQUE ("user_id", "agent_id")
);
COMMENT ON TABLE "user_agent_affinity" IS 'Tracks relationship strength between a user and an agent.';
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID NOT NULL PRIMARY KEY,
    "display_name" VARCHAR(255),
    "avatar_url" VARCHAR(512),
    "bio" TEXT,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "theme_preference" VARCHAR(20) NOT NULL DEFAULT 'system',
    "privacy_mode" BOOL NOT NULL DEFAULT False,
    "notifications_enabled" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "profiles" IS 'User profile extension for auth.users.';
CREATE TABLE IF NOT EXISTS "chat_rooms" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "idx_chat_rooms_user_id_bbcf5f" ON "chat_rooms" ("user_id");
COMMENT ON TABLE "chat_rooms" IS 'Database entity for Chat Rooms.';
CREATE TABLE IF NOT EXISTS "agent_action_logs" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" UUID NOT NULL REFERENCES "agents" ("id") ON DELETE CASCADE,
    "room_id" UUID REFERENCES "chat_rooms" ("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_agent_actio_user_id_8ec6ac" ON "agent_action_logs" ("user_id");
COMMENT ON TABLE "agent_action_logs" IS 'Audit log of agent thoughts and tool usage.';
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "agent_id" UUID,
    "content" TEXT NOT NULL,
    "message_type" VARCHAR(50) NOT NULL DEFAULT 'text',
    "attachments" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "room_id" UUID NOT NULL REFERENCES "chat_rooms" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_chat_messag_user_id_baf261" ON "chat_messages" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_chat_messag_agent_i_197d8e" ON "chat_messages" ("agent_id");
COMMENT ON TABLE "chat_messages" IS 'Database entity for Chat Messages.';
CREATE TABLE IF NOT EXISTS "chat_room_agents" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" UUID NOT NULL REFERENCES "agents" ("id") ON DELETE CASCADE,
    "room_id" UUID NOT NULL REFERENCES "chat_rooms" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_chat_room_a_room_id_260b22" UNIQUE ("room_id", "agent_id")
);
COMMENT ON TABLE "chat_room_agents" IS 'Junction table for Chat Rooms and Agents.';
CREATE TABLE IF NOT EXISTS "memory_collections" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_memory_coll_user_id_18a9d8" ON "memory_collections" ("user_id");
COMMENT ON TABLE "memory_collections" IS 'Groupings of related memories.';
CREATE TABLE IF NOT EXISTS "memories" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "agent_id" UUID,
    "room_id" UUID,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "collection_id" UUID REFERENCES "memory_collections" ("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_memories_user_id_a36d31" ON "memories" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_memories_agent_i_7415f4" ON "memories" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_memories_room_id_c0505c" ON "memories" ("room_id");
COMMENT ON TABLE "memories" IS 'Database entity for Memories (Vector Store).';
CREATE TABLE IF NOT EXISTS "memory_graph_nodes" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_memory_grap_user_id_d72df4" ON "memory_graph_nodes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_memory_grap_name_e854af" ON "memory_graph_nodes" ("name");
CREATE INDEX IF NOT EXISTS "idx_memory_grap_entity__2d3818" ON "memory_graph_nodes" ("entity_type");
COMMENT ON TABLE "memory_graph_nodes" IS 'Entity representing a concept or entity in the knowledge graph.';
CREATE TABLE IF NOT EXISTS "memory_graph_edges" (
    "id" UUID NOT NULL PRIMARY KEY,
    "relationship" VARCHAR(100) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_node_id" UUID NOT NULL REFERENCES "memory_graph_nodes" ("id") ON DELETE CASCADE,
    "target_node_id" UUID NOT NULL REFERENCES "memory_graph_nodes" ("id") ON DELETE CASCADE
);
COMMENT ON TABLE "memory_graph_edges" IS 'Relationship between two graph nodes.';
CREATE TABLE IF NOT EXISTS "memory_relationships" (
    "id" UUID NOT NULL PRIMARY KEY,
    "relationship_type" VARCHAR(50) NOT NULL DEFAULT 'RELATED_TO',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_id" UUID NOT NULL REFERENCES "memories" ("id") ON DELETE CASCADE,
    "target_id" UUID NOT NULL REFERENCES "memories" ("id") ON DELETE CASCADE
);
COMMENT ON TABLE "memory_relationships" IS 'Represents a relationship between two memories.';
CREATE TABLE IF NOT EXISTS "agent_tools" (
    "id" UUID NOT NULL PRIMARY KEY,
    "user_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'utility',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "parameters_schema" JSONB NOT NULL,
    "is_public" BOOL NOT NULL DEFAULT False,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "idx_agent_tools_user_id_895eef" ON "agent_tools" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_agent_tools_name_8ab3f4" ON "agent_tools" ("name");
CREATE INDEX IF NOT EXISTS "idx_agent_tools_categor_5e48a8" ON "agent_tools" ("category");
COMMENT ON TABLE "agent_tools" IS 'Database entity for Agent Tools/Skills.';
CREATE TABLE IF NOT EXISTS "agent_tool_links" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" UUID NOT NULL REFERENCES "agents" ("id") ON DELETE CASCADE,
    "tool_id" UUID NOT NULL REFERENCES "agent_tools" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_agent_tool__agent_i_0de312" UNIQUE ("agent_id", "tool_id")
);
COMMENT ON TABLE "agent_tool_links" IS 'Junction table for Agents and their assigned Tools.';
CREATE TABLE IF NOT EXISTS "agents_capabilities" (
    "agents_id" UUID NOT NULL REFERENCES "agents" ("id") ON DELETE CASCADE,
    "capability_id" VARCHAR(50) NOT NULL REFERENCES "capabilities" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_agents_capa_agents__5aac45" ON "agents_capabilities" ("agents_id", "capability_id");
CREATE TABLE IF NOT EXISTS "agent_templates_capabilities" (
    "agent_templates_id" UUID NOT NULL REFERENCES "agent_templates" ("id") ON DELETE CASCADE,
    "capability_id" VARCHAR(50) NOT NULL REFERENCES "capabilities" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_agent_templ_agent_t_2179ff" ON "agent_templates_capabilities" ("agent_templates_id", "capability_id");

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
CREATE OR REPLACE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY agents_owner_all ON public.agents FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY capabilities_select_all ON public.capabilities FOR SELECT USING (true);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY integrations_select_all ON public.integrations FOR SELECT USING (true);
ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_integrations_owner_all ON public.agent_integrations FOR ALL USING (EXISTS (SELECT 1 FROM agents WHERE id = agent_id AND user_id = auth.uid()));
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_templates_select_all ON public.agent_templates FOR SELECT USING (true);
ALTER TABLE public.user_agent_affinity ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_agent_affinity_owner ON public.user_agent_affinity FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_action_logs_owner ON public.agent_action_logs FOR SELECT USING (auth.uid() = user_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_rooms_owner_all ON public.chat_rooms FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_messages_owner_select ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()));
ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY memory_collections_owner_all ON public.memory_collections FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY memories_owner_all ON public.memories FOR ALL USING (auth.uid() = user_id OR (user_id IS NULL AND agent_id IS NOT NULL AND EXISTS (SELECT 1 FROM agents WHERE id = memories.agent_id AND user_id = auth.uid())));
ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY memory_relationships_owner ON public.memory_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()));
ALTER TABLE public.memory_graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY memory_graph_nodes_owner ON public.memory_graph_nodes FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.memory_graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY memory_graph_edges_owner ON public.memory_graph_edges FOR ALL USING (EXISTS (SELECT 1 FROM memory_graph_nodes WHERE id = source_node_id AND user_id = auth.uid()));
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_tools_owner_all ON public.agent_tools FOR ALL USING (user_id IS NULL OR auth.uid() = user_id OR is_public = true);

-- Custom Indexes --------------------------------------------------------

CREATE INDEX IF NOT EXISTS memories_embedding_hnsw_idx ON public.memories USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Seed Data -------------------------------------------------------------

-- Seed: Capabilities
INSERT INTO public.capabilities (id, name, description, icon) VALUES ('web_search', 'Web Search', 'Search the internet for real-time information.', 'search'), ('code_execution', 'Code Execution', 'Write and run code in a sandbox.', 'terminal'), ('image_generation', 'Image Generation', 'Create unique images from text descriptions.', 'image') ON CONFLICT (id) DO NOTHING;
-- Seed: Integrations
INSERT INTO public.integrations (id, display_name, description, icon, status, config_schema) VALUES ('steam', 'Steam', 'Connect to your Steam profile to view games and activity.', 'videogame_asset', 'active', '[{"key": "steam_id", "label": "Steam ID (Steam64)", "type": "string", "required": true, "description": "Your 17-digit Steam ID"}]'::jsonb) ON CONFLICT (id) DO NOTHING;
-- Seed: Agent Templates
INSERT INTO public.agent_templates (id, name, description, personality, goals) VALUES (gen_random_uuid(), 'The Librarian', 'A master of organization and archival data.', 'You are calm, meticulous, and obsessed with metadata. You speak formally and value precision.', '["Catalog personal memories accurately", "Assist in finding old information", "Suggest logical groupings for data"]'::jsonb) ON CONFLICT DO NOTHING;
