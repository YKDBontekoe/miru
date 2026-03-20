"""Memory repository using Tortoise ORM."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from tortoise import Tortoise
from tortoise.expressions import Q

from app.domain.memory.models import Memory, MemoryCollection, MemoryRelationship


class MemoryRepository:
    def __init__(self) -> None:
        pass

    async def insert_memory(self, memory: Memory) -> Memory:
        """Insert a new memory record."""
        await memory.save()
        return memory

    async def delete_memory(self, memory_id: UUID) -> bool:
        """Delete a memory."""
        memory = await Memory.get_or_none(id=memory_id)
        if memory:
            await memory.delete()
            return True
        return False

    async def list_all_memories(
        self,
        user_id: UUID,
        collection_id: UUID | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 100,
    ) -> list[Memory]:
        """Fetch memories for a user, with optional filters."""
        query = Memory.filter(user_id=user_id)
        if collection_id:
            query = query.filter(collection_id=collection_id)
        if start_date:
            query = query.filter(created_at__gte=start_date)
        if end_date:
            query = query.filter(created_at__lte=end_date)

        return await query.order_by("-created_at").limit(limit).all()

    async def update_memory(self, memory_id: UUID, update_data: dict[str, Any]) -> Memory | None:
        """Update specific fields of a memory."""
        memory = await Memory.get_or_none(id=memory_id)
        if not memory:
            return None

        for key, value in update_data.items():
            setattr(memory, key, value)

        await memory.save()
        return memory

    async def get_on_this_day(self, user_id: UUID, limit: int = 10) -> list[Memory]:
        """Fetch memories from the same month and day in previous years."""
        conn = Tortoise.get_connection("default")
        sql = """
            SELECT * FROM memories
            WHERE user_id = $1
            AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(DAY FROM created_at) = EXTRACT(DAY FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) < EXTRACT(YEAR FROM CURRENT_DATE)
            ORDER BY created_at DESC
            LIMIT $2
        """
        records = await conn.execute_query_dict(sql, [str(user_id), limit])
        return [Memory(**row) for row in records]

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

    async def search_fulltext(
        self, query: str, user_id: UUID, collection_id: UUID | None = None
    ) -> list[Memory]:
        """Full-text search for memories using PostgreSQL vector or LIKE fallback."""
        conn = Tortoise.get_connection("default")
        # Ensure we use user_id to restrict the search
        params: list[Any] = [f"%{query}%", str(user_id)]

        sql = "SELECT * FROM memories WHERE content ILIKE $1 AND user_id = $2"
        if collection_id:
            sql += " AND collection_id = $3"
            params.append(str(collection_id))

        sql += " LIMIT 50"

        records = await conn.execute_query_dict(sql, params)
        return [Memory(**row) for row in records]

    # --- Collection Management ---

    async def create_collection(
        self, user_id: UUID, name: str, description: str | None = None
    ) -> MemoryCollection:
        """Create a new memory collection."""
        return await MemoryCollection.create(user_id=user_id, name=name, description=description)

    async def list_collections(self, user_id: UUID) -> list[MemoryCollection]:
        """List all collections for a user."""
        return await MemoryCollection.filter(user_id=user_id).order_by("name").all()

    async def update_collection(
        self, collection_id: UUID, name: str | None = None, description: str | None = None
    ) -> MemoryCollection | None:
        """Update an existing collection."""
        collection = await MemoryCollection.get_or_none(id=collection_id)
        if not collection:
            return None

        if name is not None:
            collection.name = name
        if description is not None:
            collection.description = description

        await collection.save()
        return collection

    async def delete_collection(self, collection_id: UUID) -> bool:
        """Delete a collection."""
        collection = await MemoryCollection.get_or_none(id=collection_id)
        if collection:
            await collection.delete()
            return True
        return False

    async def get_relationships_subgraph(self, memory_ids: list[UUID]) -> list[MemoryRelationship]:
        """Fetch relationships between a set of memory IDs."""
        if not memory_ids:
            return []

        return await MemoryRelationship.filter(
            source_id__in=memory_ids, target_id__in=memory_ids
        ).all()
