"""Memory service for business logic and vector/graph integration."""

from __future__ import annotations

import io
import logging
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

        # 4. Trigger intelligent graph extraction in the background
        if u_id:
            try:
                import asyncio

                from app.domain.memory.graph_service import GraphExtractionService

                asyncio.create_task(  # noqa: RUF006
                    GraphExtractionService.process_and_store_graph(content, u_id)
                )
            except Exception:
                logger.warning("Failed to trigger background graph extraction", exc_info=True)

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

        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None

        # Prepare summary and chunks
        intro_content = (
            f"Document: {filename}\nType: {content_type}\n"
            "Summary: Contains extracted text from this file."
        )
        chunks = await asyncio.to_thread(DocumentService.chunk_text, text)

        all_contents = [intro_content] + [
            (f"[From document: {filename}, part {i + 1}]\n" f"{chunk}")
            for i, chunk in enumerate(chunks)
        ]

        # Exact-match deduplication early on to avoid embedding identical strings
        unique_contents = list(dict.fromkeys(all_contents))

        # Batch embed all unique chunks
        embeddings = await embed(unique_contents)

        if len(embeddings) != len(unique_contents):
            logger.error("Embeddings length mismatch in store_document_memory")
            return []

        async def check_dedup(idx: int, vec: list[float], txt: str) -> Memory | None:
            existing = await self.repo.match_memories(vec, DEDUP_THRESHOLD, 1, u_id, a_id, r_id)
            if existing:
                return None
            return Memory(
                content=txt,
                embedding=vec,
                user_id=u_id,
                agent_id=a_id,
                room_id=r_id,
            )

        # Parallel semantic deduplication with concurrency limit
        sem = asyncio.Semaphore(5)

        async def _bounded_check_dedup(idx: int, vec: list[float], txt: str) -> Memory | None:
            async with sem:
                return await check_dedup(idx, vec, txt)

        tasks = [
            _bounded_check_dedup(i, vec, txt)
            for i, (vec, txt) in enumerate(zip(embeddings, unique_contents, strict=True))
        ]
        results = await asyncio.gather(*tasks)

        memories_to_insert = [m for m in results if m is not None]

        if not memories_to_insert:
            return []

        # Batch insert
        inserted = await self.repo.bulk_insert_memories(memories_to_insert)

        # Trigger intelligent graph extraction in the background for each new memory
        if u_id:
            try:
                from app.domain.memory.graph_service import GraphExtractionService
                for m in inserted:
                    asyncio.create_task(  # noqa: RUF006
                        GraphExtractionService.process_and_store_graph(m.content, u_id)
                    )
            except Exception:
                logger.warning("Failed to trigger background graph extraction", exc_info=True)

        return [m.id for m in inserted]

    async def delete_memory(self, memory_id: UUID, user_id: UUID | None = None) -> bool:
        """Delete a single memory and its relationships by delegating to the repository layer.

        Args:
            memory_id: The UUID of the memory to delete.
            user_id: The optional UUID of the user performing the deletion. When provided,
                ownership enforcement prevents unauthorized deletion of other users' memories.

        Returns:
            True if the memory was successfully found and deleted, False otherwise.
        """
        return await self.repo.delete_memory(memory_id, user_id=user_id)

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
