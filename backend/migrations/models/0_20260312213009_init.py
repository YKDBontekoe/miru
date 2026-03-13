from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
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
    "capabilities" JSONB NOT NULL,
    "integrations" JSONB NOT NULL,
    "integration_configs" JSONB NOT NULL,
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
    "capabilities" JSONB NOT NULL,
    "integrations" JSONB NOT NULL,
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
COMMENT ON TABLE "integrations" IS 'Database entity for Agent Integrations.';
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
    "embedding" JSONB NOT NULL,
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
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
)
