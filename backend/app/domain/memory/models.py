"""Memory domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class MemoryCollection(SupabaseModel):
    """Groupings of related memories."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    name: str = fields.CharField(max_length=255)  # type: ignore[assignment]
    description: str | None = fields.TextField(null=True)
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "memory_collections"
        sql_policies = [
            "ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_collections_owner_all ON public.memory_collections "
            "FOR ALL USING (auth.uid() = user_id);",
        ]


class Memory(SupabaseModel):
    """Database entity for Memories (Vector Store)."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    agent_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    room_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    collection: fields.ForeignKeyRelation[MemoryCollection] | None = fields.ForeignKeyField(
        "models.MemoryCollection",
        related_name="memories",
        on_delete=fields.SET_NULL,
        null=True,
    )

    content: str = fields.TextField()
    embedding: list[float] = (
        fields.JSONField()
    )  # Stored as vector(1536) in Postgres; patched by generator
    meta: dict = fields.JSONField(default={})

    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

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

    id: UUID = fields.UUIDField(primary_key=True)
    source: fields.ForeignKeyRelation[Memory] = fields.ForeignKeyField(
        "models.Memory", related_name="relationships_out", on_delete=fields.CASCADE
    )
    target: fields.ForeignKeyRelation[Memory] = fields.ForeignKeyField(
        "models.Memory", related_name="relationships_in", on_delete=fields.CASCADE
    )
    relationship_type: str = fields.CharField(max_length=50, default="RELATED_TO")  # type: ignore[assignment]
    weight: float = fields.FloatField(default=1.0)
    meta: dict = fields.JSONField(default={})
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

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

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    name: str = fields.CharField(max_length=255, db_index=True)  # type: ignore[assignment]
    entity_type: str = fields.CharField(max_length=50, db_index=True)  # type: ignore[assignment]
    description: str | None = fields.TextField(null=True)
    meta: dict = fields.JSONField(default={})
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "memory_graph_nodes"
        sql_policies = [
            "ALTER TABLE public.memory_graph_nodes ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_graph_nodes_owner ON public.memory_graph_nodes "
            "FOR ALL USING (auth.uid() = user_id);",
        ]


class MemoryGraphEdge(SupabaseModel):
    """Relationship between two graph nodes."""

    id: UUID = fields.UUIDField(primary_key=True)
    source_node: fields.ForeignKeyRelation[MemoryGraphNode] = fields.ForeignKeyField(
        "models.MemoryGraphNode", related_name="edges_out", on_delete=fields.CASCADE
    )
    target_node: fields.ForeignKeyRelation[MemoryGraphNode] = fields.ForeignKeyField(
        "models.MemoryGraphNode", related_name="edges_in", on_delete=fields.CASCADE
    )
    relationship: str = fields.CharField(max_length=100)  # type: ignore[assignment]
    weight: float = fields.FloatField(default=1.0)
    meta: dict = fields.JSONField(default={})
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "memory_graph_edges"
        sql_policies = [
            "ALTER TABLE public.memory_graph_edges ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY memory_graph_edges_owner ON public.memory_graph_edges "
            "FOR ALL USING (EXISTS ("
            "SELECT 1 FROM memory_graph_nodes WHERE id = source_node_id AND user_id = auth.uid()"
            "));",
        ]


# ---------------------------------------------------------------------------
# API Pydantic Schemas
# ---------------------------------------------------------------------------


class MemoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID | None
    agent_id: UUID | None
    room_id: UUID | None
    content: str
    meta: dict
    created_at: datetime
    updated_at: datetime


class MemoryRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source_id: UUID
    target_id: UUID
    relationship_type: str
    weight: float
    meta: dict
    created_at: datetime


class MemoryGraphResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    nodes: list[MemoryResponse]
    edges: list[MemoryRelationshipResponse]


class MemoryRequest(BaseModel):
    message: str
