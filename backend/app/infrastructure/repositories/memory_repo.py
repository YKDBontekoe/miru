"""Memory repository using Tortoise ORM."""

from __future__ import annotations

from uuid import UUID

from tortoise.expressions import RawSQL

from app.domain.memory.models import Memory, MemoryGraphEdge, MemoryGraphNode, MemoryRelationship


class MemoryRepository:
    def __init__(self) -> None:
        pass

    async def insert_memory(self, memory: Memory) -> Memory:
        """Insert a new memory record."""
        await memory.save()
        return memory

    async def delete_memory(self, memory_id: UUID, user_id: UUID) -> bool:
        """Delete a memory."""
        memory = await Memory.get_or_none(id=memory_id)
        if not memory:
            return False
        if memory.user_id != user_id:
            raise ValueError("Unauthorized or not found")
        await memory.delete()
        return True

    async def list_all_memories(self, user_id: UUID, limit: int = 100) -> list[Memory]:
        """Fetch all memories for a user (no vector match)."""
        return await Memory.filter(user_id=user_id).order_by("-created_at").limit(limit)

    async def match_memories(
        self,
        query_embedding: list[float],
        match_threshold: float,
        match_count: int,
        user_id: UUID | None = None,
        agent_id: UUID | None = None,
        room_id: UUID | None = None,
    ) -> list[Memory]:
        """Perform semantic vector search using pgvector's cosine distance operator (<=>)."""
        from tortoise import Tortoise

        conn = Tortoise.get_connection("default")

        # Convert embedding list to Postgres vector format: '[0.1, 0.2, ...]'
        vector_str = f"[{','.join(map(str, query_embedding))}]"

        # Note: Tortoise raw queries require careful parameterization.
        # We explicitly cast parameters to ensure Postgres correctly types them,
        # otherwise Tortoise sends them as string blocks.
        sql = """
            SELECT id, user_id, agent_id, room_id, content, meta, created_at,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM memories
            WHERE 1 - (embedding <=> $1::vector) > $2::float
              AND ($3::int = 1 OR user_id = $4::uuid)
              AND ($5::uuid IS NULL OR agent_id = $5::uuid)
              AND ($6::uuid IS NULL OR room_id = $6::uuid)
            ORDER BY similarity DESC
            LIMIT $7::int
        """

        # Map inputs to raw SQL params
        ignore_user = 1 if user_id is None else 0
        params = [
            vector_str,
            match_threshold,
            ignore_user,
            str(user_id) if user_id else None,
            str(agent_id) if agent_id else None,
            str(room_id) if room_id else None,
            match_count,
        ]

        rows = await conn.execute_query_dict(sql, params)
        # Parse rows back to Tortoise models
        return [Memory(**row) for row in rows]

    async def create_relationship(
        self, source_id: UUID, target_id: UUID, rel_type: str = "RELATED_TO"
    ) -> MemoryRelationship:
        """Create a graph edge linking two memories."""
        return await MemoryRelationship.create(
            source_id=source_id, target_id=target_id, relationship_type=rel_type
        )

    async def find_related(self, memory_id: UUID, rel_type: str | None = None) -> list[Memory]:
        """Find memories explicitly linked to this one."""
        query = MemoryRelationship.filter(source_id=memory_id)
        if rel_type:
            query = query.filter(relationship_type=rel_type)

        rels = await query.prefetch_related("target")
        return [r.target for r in rels]

    async def get_relationships_subgraph(self, memory_ids: list[UUID]) -> list[MemoryRelationship]:
        """Fetch all relationships originating from the given memory IDs."""
        if not memory_ids:
            return []
        return await MemoryRelationship.filter(source_id__in=memory_ids).all()

    async def search_fulltext(self, query: str) -> list[Memory]:
        """Optional/Future full-text search capability using PostgreSQL @@."""
        from tortoise import Tortoise

        conn = Tortoise.get_connection("default")
        sql = "SELECT * FROM memories WHERE content_fts @@ websearch_to_tsquery('english', $1)"
        rows = await conn.execute_query_dict(sql, [query])
        return [Memory(**row) for row in rows]
