"""Memory service for business logic and vector/graph integration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.domain.memory.models import Memory
from app.infrastructure.external.openrouter import embed

if TYPE_CHECKING:
    from app.infrastructure.repositories.memory_repo import MemoryRepository

logger = logging.getLogger(__name__)

TOP_K = 5
DEDUP_THRESHOLD = 0.97


class MemoryService:
    def __init__(self, repo: MemoryRepository):
        self.repo = repo

    async def store_memory(
        self,
        content: str,
        user_id: UUID | str | None = None,
        agent_id: UUID | str | None = None,
        room_id: UUID | str | None = None,
        related_to: list[UUID] | None = None,
    ) -> UUID | None:
        """Persist a memory fact with semantic deduplication and graph linkage."""
        content = content.strip()
        if not content:
            return None

        vector = await embed(content)

        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None

        # 1. Deduplication check
        existing = await self.repo.match_memories(vector, DEDUP_THRESHOLD, 1, u_id, a_id, r_id)
        if existing:
            return None

        # 2. Insert Memory
        memory = Memory(
            content=content,
            embedding=vector,
            user_id=u_id,
            agent_id=a_id,
            room_id=r_id,
        )
        stored_memory = await self.repo.insert_memory(memory)
        memory_id = stored_memory.id

        # 3. Handle Relationships
        if related_to:
            try:
                for rid in related_to:
                    await self.repo.create_relationship(memory_id, rid)
            except Exception as e:
                logger.warning(f"Relationship creation failed: {e}")

        return memory_id

    async def delete_memory(self, memory_id: UUID, user_id: UUID) -> bool:
        return await self.repo.delete_memory(memory_id, user_id)

    async def get_memory_graph(self, user_id: UUID) -> dict[str, Any]:
        """Fetch all memories and their relationships for the graph view."""
        memories = await self.repo.list_all_memories(user_id)
        if not memories:
            return {
                "nodes": [],
                "edges": [],
            }

        m_ids = [m.id for m in memories]
        edges = await self.repo.get_relationships_subgraph(m_ids)

        return {
            "nodes": memories,
            "edges": edges,
        }

    async def retrieve_memories(
        self,
        query: str,
        user_id: UUID | str | None = None,
        agent_id: UUID | str | None = None,
        room_id: UUID | str | None = None,
    ) -> list[Memory]:
        """Fetch similar memories from the vector store."""
        vector = await embed(query) if query else [0.0] * 1536  # Default vector for blank list
        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None

        return await self.repo.match_memories(vector, 0.0, TOP_K, u_id, a_id, r_id)
