"""Memory service for business logic and vector/graph integration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.infrastructure.external.openrouter import embed

if TYPE_CHECKING:
    from uuid import UUID

    from app.infrastructure.repositories.memory_repo import MemoryRepository
    pass

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
        agent_id: str | None = None,
        room_id: str | None = None,
        related_to: list[str] | None = None,
    ) -> str | None:
        """Persist a memory fact with semantic deduplication and graph linkage."""
        content = content.strip()
        if not content:
            return None

        vector = await embed(content)

        # 1. Deduplication check
        existing = await self.repo.match_memories(
            vector, DEDUP_THRESHOLD, 1, str(user_id) if user_id else None, agent_id, room_id
        )
        if existing:
            return None

        # 2. Supabase Insert
        insert_data = {"content": content, "embedding": vector}
        if user_id:
            insert_data["user_id"] = str(user_id)
        if agent_id:
            insert_data["agent_id"] = agent_id
        if room_id:
            insert_data["room_id"] = room_id

        memory_id = await self.repo.insert_memory(insert_data)

        # 3. Neo4j Insert
        try:
            await self.repo.create_node(memory_id, content, vector)
            if related_to:
                for rid in related_to:
                    await self.repo.create_relationship(memory_id, rid)
        except Exception as e:
            logger.warning(f"Neo4j link failed: {e}")

        return memory_id

    async def retrieve_memories(
        self,
        query: str,
        user_id: UUID | str | None = None,
        agent_id: str | None = None,
        room_id: str | None = None,
    ) -> list[str]:
        """Fetch similar memories from the vector store."""
        vector = await embed(query)
        data = await self.repo.match_memories(
            vector, 0.0, TOP_K, str(user_id) if user_id else None, agent_id, room_id
        )
        return [r["content"] for r in data]
