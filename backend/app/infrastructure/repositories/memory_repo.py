"""Memory repository using Tortoise ORM."""

from __future__ import annotations

from uuid import UUID

from tortoise import Tortoise
from tortoise.expressions import Q

from app.domain.memory.models import Memory, MemoryRelationship


class MemoryRepository:
    def __init__(self) -> None:
        pass

    async def insert_memory(self, memory: Memory) -> Memory:
        """Insert a new memory record."""
        await memory.save()
        return memory

    async def delete_memory(self, memory_id: UUID, user_id: UUID) -> bool:
        """Delete a memory."""
        memory = await Memory.get_or_none(id=memory_id, user_id=user_id)
        if memory:
            await memory.delete()
            return True
        return False

    async def list_all_memories(self, user_id: UUID, limit: int = 100) -> list[Memory]:
        """Fetch all memories for a user (no vector match)."""
        return await Memory.filter(user_id=user_id).limit(limit).all()

    async def match_memories(
        self,
        vector: list[float],
        threshold: float,
        count: int,
        user_id: UUID | None = None,
        agent_id: UUID | None = None,
        room_id: UUID | None = None,
    ) -> list[Memory]:
        """Search for memories by vector similarity using the match_memories RPC."""
        conn = Tortoise.get_connection("default")
        # Use fully parameterized query — no f-string interpolation.
        # $1 is cast to vector by PostgreSQL; all six positional params are asyncpg bindings.
        query = """
            SELECT * FROM match_memories(
                query_embedding := $1::vector,
                match_threshold := $2,
                match_count := $3,
                p_user_id := $4::uuid,
                p_agent_id := $5::uuid,
                p_room_id := $6::uuid
            )
        """
        # asyncpg expects the vector as a bracket-formatted string, e.g. "[0.1,0.2,...]"
        vector_str = "[" + ",".join(str(v) for v in vector) + "]"
        p_user_id = str(user_id) if user_id else None
        p_agent_id = str(agent_id) if agent_id else None
        p_room_id = str(room_id) if room_id else None

        records = await conn.execute_query_dict(
            query, [vector_str, threshold, count, p_user_id, p_agent_id, p_room_id]
        )
        return [Memory(**row) for row in records]

    async def create_relationship(
        self,
        from_id: UUID,
        to_id: UUID,
        rel_type: str = "RELATED_TO",
    ) -> MemoryRelationship:
        """Create a relationship between two memories."""
        return await MemoryRelationship.create(
            source_id=from_id, target_id=to_id, relationship_type=rel_type
        )

    async def find_related(self, memory_id: UUID, rel_type: str | None = None) -> list[Memory]:
        """Find related memories."""
        q = MemoryRelationship.filter(Q(source_id=memory_id) | Q(target_id=memory_id))
        if rel_type:
            q = q.filter(relationship_type=rel_type)

        rels = await q.limit(10).all()
        related_ids: set[UUID] = set()
        for rel in rels:
            # Tortoise adds _id fields for foreign keys
            s_id: UUID = getattr(rel, "source_id")  # noqa: B009
            t_id: UUID = getattr(rel, "target_id")  # noqa: B009
            if s_id != memory_id:
                related_ids.add(s_id)
            if t_id != memory_id:
                related_ids.add(t_id)

        if not related_ids:
            return []

        return await Memory.filter(id__in=list(related_ids)).all()

    async def search_fulltext(self, query: str) -> list[Memory]:
        """Full-text search for memories using PostgreSQL fts."""
        # Tortoise doesn't support fts natively well, so we use raw SQL
        conn = Tortoise.get_connection("default")
        sql = "SELECT * FROM memories WHERE fts @@ plainto_tsquery('english', $1) LIMIT 10"
        records = await conn.execute_query_dict(sql, [query])
        return [Memory(**row) for row in records]

    async def get_relationships_subgraph(self, memory_ids: list[UUID]) -> list[MemoryRelationship]:
        """Fetch relationships between a set of memory IDs."""
        if not memory_ids:
            return []

        return await MemoryRelationship.filter(
            source_id__in=memory_ids, target_id__in=memory_ids
        ).all()
