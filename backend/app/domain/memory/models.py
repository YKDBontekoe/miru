"""Memory domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class MemoryCollection(SupabaseModel):
    """Groupings of related memories."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "memory_collections"
        sql_functions = [
            """
            CREATE OR REPLACE FUNCTION match_memories(
                query_embedding vector(1536),
                match_threshold float,
                match_count int,
                p_user_id uuid DEFAULT NULL,
                p_agent_id uuid DEFAULT NULL,
                p_room_id uuid DEFAULT NULL
            )
            RETURNS TABLE (
                id uuid,
                user_id uuid,
                agent_id uuid,
                room_id uuid,
                content text,
                embedding vector(1536),
                meta jsonb,
                created_at timestamptz,
                updated_at timestamptz,
                deleted_at timestamptz,
                collection_id uuid,
                similarity float
            )
            LANGUAGE plpgsql
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    memories.id,
                    memories.user_id,
                    memories.agent_id,
                    memories.room_id,
                    memories.content,
                    memories.embedding,
                    memories.meta,
                    memories.created_at,
                    memories.updated_at,
                    memories.deleted_at,
                    memories.collection_id,
                    1 - (memories.embedding <=> query_embedding) AS similarity
                FROM memories
                WHERE (1 - (memories.embedding <=> query_embedding) > match_threshold)
                  AND (p_user_id IS NULL OR memories.user_id = p_user_id)
                  AND (p_agent_id IS NULL OR memories.agent_id = p_agent_id)
                  AND (p_room_id IS NULL OR memories.room_id = p_room_id)
                ORDER BY memories.embedding <=> query_embedding
                LIMIT match_count;
            END;
            $$;
            """
        ]
        sql_policies = [
            "ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_collections_owner_all ON public.memory_collections "
            "FOR ALL USING (auth.uid() = user_id);",
        ]


class Memory(SupabaseModel):
    """Database entity for Memories (Vector Store)."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(null=True, db_index=True)
    agent_id = fields.UUIDField(null=True, db_index=True)
    room_id = fields.UUIDField(null=True, db_index=True)
    collection: fields.ForeignKeyRelation[MemoryCollection] | None = fields.ForeignKeyField(
        "models.MemoryCollection",
        related_name="memories",
        on_delete=fields.SET_NULL,
        null=True,
    )

    content = fields.TextField()
    embedding = fields.JSONField()  # Stored as vector(1536) in Postgres; patched by generator
    meta = fields.JSONField(default={})

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "memories"
        sql_indexes = [
            "CREATE INDEX IF NOT EXISTS memories_embedding_hnsw_idx ON public.memories "
            "USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);",
        ]
        sql_policies = [
            "ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memories_owner_all ON public.memories FOR ALL USING ("
            "auth.uid() = user_id OR ("
            "user_id IS NULL AND agent_id IS NOT NULL AND EXISTS ("
            "SELECT 1 FROM agents WHERE id = memories.agent_id AND user_id = auth.uid()"
            ")));",
        ]


class MemoryRelationship(SupabaseModel):
    """Represents a relationship between two memories."""

    id = fields.UUIDField(primary_key=True)
    source: fields.ForeignKeyRelation[Memory] = fields.ForeignKeyField(
        "models.Memory", related_name="relationships_out", on_delete=fields.CASCADE
    )
    target: fields.ForeignKeyRelation[Memory] = fields.ForeignKeyField(
        "models.Memory", related_name="relationships_in", on_delete=fields.CASCADE
    )
    relationship_type = fields.CharField(max_length=50, default="RELATED_TO")
    weight = fields.FloatField(default=1.0)
    meta = fields.JSONField(default={})
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "memory_relationships"
        sql_policies = [
            "ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_relationships_owner_select ON public.memory_relationships "
            "FOR SELECT USING (EXISTS ("
            "SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY memory_relationships_owner_insert ON public.memory_relationships "
            "FOR INSERT WITH CHECK (EXISTS ("
            "SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY memory_relationships_owner_delete ON public.memory_relationships "
            "FOR DELETE USING (EXISTS ("
            "SELECT 1 FROM memories WHERE id = source_id AND user_id = auth.uid()"
            "));",
        ]


class MemoryGraphNode(SupabaseModel):
    """Entity representing a concept or entity in the knowledge graph."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(null=True, db_index=True)
    name = fields.CharField(max_length=255, db_index=True)
    entity_type = fields.CharField(max_length=50, db_index=True)
    description = fields.TextField(null=True)
    meta = fields.JSONField(default={})
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "memory_graph_nodes"
        unique_together = (("user_id", "name"),)
        sql_policies = [
            "ALTER TABLE public.memory_graph_nodes ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_graph_nodes_owner ON public.memory_graph_nodes "
            "FOR ALL USING (auth.uid() = user_id);",
        ]


class MemoryGraphEdge(SupabaseModel):
    """Relationship between two graph nodes."""

    id = fields.UUIDField(primary_key=True)
    source_node: fields.ForeignKeyRelation[MemoryGraphNode] = fields.ForeignKeyField(
        "models.MemoryGraphNode", related_name="edges_out", on_delete=fields.CASCADE
    )
    target_node: fields.ForeignKeyRelation[MemoryGraphNode] = fields.ForeignKeyField(
        "models.MemoryGraphNode", related_name="edges_in", on_delete=fields.CASCADE
    )
    relationship = fields.CharField(max_length=100)
    weight = fields.FloatField(default=1.0)
    meta = fields.JSONField(default={})
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "memory_graph_edges"
        unique_together = (("source_node", "target_node", "relationship"),)
        sql_policies = [
            "ALTER TABLE public.memory_graph_edges ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_graph_edges_owner ON public.memory_graph_edges "
            "FOR ALL USING (EXISTS ("
            "SELECT 1 FROM memory_graph_nodes WHERE id = source_node_id AND user_id = auth.uid()"
            "));",
        ]
