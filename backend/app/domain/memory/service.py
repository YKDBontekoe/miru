"""Memory service for business logic and vector/graph integration."""

from __future__ import annotations

import io
import logging
from datetime import date, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.domain.memory.document_service import DocumentService
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

    async def store_document_memory(
        self,
        file: io.BytesIO,
        filename: str,
        content_type: str,
        user_id: UUID | str | None = None,
        agent_id: UUID | str | None = None,
        room_id: UUID | str | None = None,
    ) -> list[UUID]:
        """Process an uploaded document, chunk it, and store as memory."""
        import asyncio

        text = await asyncio.to_thread(DocumentService.extract_text, file, filename, content_type)
        if not text:
            return []

        # Summarize (optional/basic format)
        intro_content = f"Document: {filename}\nType: {content_type}\nSummary: Contains extracted text from this file."
        await self.store_memory(
            content=intro_content,
            user_id=user_id,
            agent_id=agent_id,
            room_id=room_id,
        )

        chunks = await asyncio.to_thread(DocumentService.chunk_text, text)
        memory_ids = []
        for i, chunk in enumerate(chunks):
            chunk_content = f"[From document: {filename}, part {i + 1}]\n{chunk}"
            mid = await self.store_memory(
                content=chunk_content,
                user_id=user_id,
                agent_id=agent_id,
                room_id=room_id,
            )
            if mid:
                memory_ids.append(mid)

        return memory_ids

    async def delete_memory(self, memory_id: UUID) -> bool:
        return await self.repo.delete_memory(memory_id)

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

    async def search_memories(
        self,
        user_id: UUID,
        query: str,
        start_date: date,
        end_date: date,
        limit: int = 100,
    ) -> list[Memory]:
        """Search memories by query and date range.

        If query is empty or whitespace, returns memories within the date range.
        """
        # If query is empty/whitespace, use date range fallback
        if not query or not query.strip():
            start_dt = datetime.combine(start_date, datetime.min.time())
            end_dt = datetime.combine(end_date, datetime.max.time())
            return await self.repo.list_memories_between(user_id, start_dt, end_dt, limit)

        # Otherwise, use vector search
        vector = await embed(query)
        return await self.repo.match_memories(vector, 0.0, limit, user_id, None, None)

    async def merge_memories(
        self,
        user_id: UUID,
        memory_ids: list[UUID],
    ) -> Memory | None:
        """Merge multiple memories into one, deleting duplicates.

        Combines content from all memories and creates a new merged memory.
        The oldest memory is updated with merged content, others are deleted.
        """
        if len(memory_ids) < 2:
            return None

        memories = await self.repo.get_memories_by_ids(memory_ids)

        # Filter to only user's memories and sort by creation date (oldest first)
        user_memories = [m for m in memories if m.user_id == user_id]
        if len(user_memories) < 2:
            return None

        user_memories.sort(key=lambda m: m.created_at)

        # Oldest memory becomes the merged one
        oldest = user_memories[0]
        to_merge = user_memories[1:]

        # Combine content
        contents = [oldest.content] + [m.content for m in to_merge]
        merged_content = "\n\n".join(contents)

        # Update oldest memory with merged content
        oldest.content = merged_content
        oldest.meta = oldest.meta or {}
        oldest.meta["merged_from"] = [str(m.id) for m in to_merge]
        oldest.updated_at = datetime.now()

        # Generate new embedding for merged content
        oldest.embedding = await embed(merged_content)

        await self.repo.update_memory(oldest)

        # Delete the merged memories
        for memory in to_merge:
            await self.repo.delete_memory(memory.id)

        return oldest

    async def get_on_this_day(
        self,
        user_id: UUID,
        reference_date: date | None = None,
        limit: int = 100,
    ) -> list[Memory]:
        """Get memories from the same day in previous years ("on this day" feature).

        Filters memories by month and day, excluding the current year.
        """
        ref_date = reference_date or date.today()

        # Get all memories for the user
        all_memories = await self.repo.list_all_memories(user_id, limit)

        # Filter by month and day, excluding current year
        result = []
        for memory in all_memories:
            mem_date = memory.created_at
            if (
                mem_date.month == ref_date.month
                and mem_date.day == ref_date.day
                and mem_date.year != ref_date.year
            ):
                result.append(memory)

        return result
