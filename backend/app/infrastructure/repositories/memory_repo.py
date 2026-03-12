"""Memory repository for SQLModel operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import text
from sqlmodel import select, or_

from app.domain.memory.models import Memory, MemoryRelationship

if TYPE_CHECKING:
    from uuid import UUID
    from sqlmodel.ext.asyncio.session import AsyncSession


class MemoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --- SQLModel (Vector Store) Operations ---

    async def insert_memory(self, memory: Memory) -> Memory:
        """Insert a new memory record."""
        self.session.add(memory)
        await self.session.commit()
        await self.session.refresh(memory)
        return memory

    async def delete_memory(self, memory_id: UUID) -> bool:
        """Delete a memory."""
        memory = await self.session.get(Memory, memory_id)
        if memory:
            await self.session.delete(memory)
            await self.session.commit()
            return True
        return False

    async def list_all_memories(self, user_id: UUID, limit: int = 100) -> list[Memory]:
        """Fetch all memories for a user (no vector match)."""
        statement = select(Memory).where(Memory.user_id == user_id).limit(limit)
        result = await self.session.exec(statement)
        return list(result.all())

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
        statement = text("""
            SELECT * FROM match_memories(
                query_embedding := :query_embedding,
                match_threshold := :match_threshold,
                match_count := :match_count,
                p_user_id := :p_user_id,
                p_agent_id := :p_agent_id,
                p_room_id := :p_room_id
            )
            """)
        params = {
            "query_embedding": str(vector),
            "match_threshold": threshold,
            "match_count": count,
            "p_user_id": str(user_id) if user_id else None,
            "p_agent_id": str(agent_id) if agent_id else None,
            "p_room_id": str(room_id) if room_id else None,
        }
        result = await self.session.execute(statement, params)
        # Convert result mappings to Memory objects
        return [Memory(**row) for row in result.mappings()]

    # --- Relationship Operations ---

    async def create_relationship(
        self,
        from_id: UUID,
        to_id: UUID,
        rel_type: str = "RELATED_TO",
    ) -> MemoryRelationship:
        """Create a relationship between two memories."""
        rel = MemoryRelationship(
            source_id=from_id,
            target_id=to_id,
            relationship_type=rel_type
        )
        self.session.add(rel)
        await self.session.commit()
        await self.session.refresh(rel)
        return rel

    async def find_related(self, memory_id: UUID, rel_type: str | None = None) -> list[Memory]:
        """Find related memories."""
        statement = select(Memory).join(
            MemoryRelationship,
            or_(
                MemoryRelationship.target_id == Memory.id,
                MemoryRelationship.source_id == Memory.id
            )
        ).where(
            or_(
                MemoryRelationship.source_id == memory_id,
                MemoryRelationship.target_id == memory_id
            )
        ).where(
            Memory.id != memory_id
        )
        
        if rel_type:
            statement = statement.where(MemoryRelationship.relationship_type == rel_type)
            
        statement = statement.limit(10)
        result = await self.session.exec(statement)
        return list(result.all())

    async def search_fulltext(self, query: str) -> list[Memory]:
        """Full-text search for memories using PostgreSQL fts."""
        statement = select(Memory).where(
            text("fts @@ plainto_tsquery('english', :query)")
        ).params(query=query).limit(10)
        
        result = await self.session.exec(statement)
        return list(result.all())

    async def get_relationships_subgraph(self, memory_ids: list[UUID]) -> list[MemoryRelationship]:
        """Fetch relationships between a set of memory IDs."""
        statement = select(MemoryRelationship).where(
            MemoryRelationship.source_id.in_(memory_ids),
            MemoryRelationship.target_id.in_(memory_ids)
        )
        result = await self.session.exec(statement)
        return list(result.all())
