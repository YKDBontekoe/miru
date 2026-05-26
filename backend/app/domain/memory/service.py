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

        vector_res = await embed(content)
        vector = vector_res[0] if isinstance(vector_res[0], list) else vector_res

        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None

        # 1. Deduplication check
        existing = await self.repo.match_memories(vector, DEDUP_THRESHOLD, 1, u_id, a_id, r_id)  # type: ignore
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
        import uuid

        text = await asyncio.to_thread(DocumentService.extract_text, file, filename, content_type)
        if not text:
            return []

        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None

        # Summarize (optional/basic format)
        intro_content = f"Document: {filename}\nType: {content_type}\nSummary: Contains extracted text from this file."

        chunks = await asyncio.to_thread(DocumentService.chunk_text, text)

        all_contents = [intro_content]
        for i, chunk in enumerate(chunks):
            all_contents.append(f"[From document: {filename}, part {i + 1}]\n{chunk}")

        # Batch embed all contents
        vectors = await embed(all_contents)

        # Parallel deduplication with batching to avoid connection pool exhaustion
        async def check_dedup(idx, content, vector):
            existing = await self.repo.match_memories(vector, DEDUP_THRESHOLD, 1, u_id, a_id, r_id)  # type: ignore
            if existing:
                return None
            return (idx, content, vector)

        valid_entries = []
        batch_size = 5

        for i in range(0, len(all_contents), batch_size):
            batch_contents = all_contents[i : i + batch_size]
            batch_vectors = vectors[i : i + batch_size]

            batch_results = await asyncio.gather(
                *(
                    check_dedup(i + j, c, v)
                    for j, (c, v) in enumerate(zip(batch_contents, batch_vectors, strict=False))
                )
            )
            valid_entries.extend([res for res in batch_results if res is not None])

        # Internal exact-match deduplication
        seen_contents = set()
        unique_entries = []
        for _idx, content, vector in valid_entries:
            if content not in seen_contents:
                seen_contents.add(content)
                unique_entries.append((_idx, content, vector))

        if not unique_entries:
            return []

        # Bulk create memories
        memories_to_insert = []
        chunk_memory_ids = []

        for idx, c, v in unique_entries:
            new_id = uuid.uuid4()
            memories_to_insert.append(
                Memory(
                    id=new_id,
                    content=c,
                    embedding=v,
                    user_id=u_id,
                    agent_id=a_id,
                    room_id=r_id,
                )
            )
            # Only return IDs for the chunks (index > 0)
            if idx > 0:
                chunk_memory_ids.append(new_id)

        await self.repo.bulk_insert_memories(memories_to_insert)
        return chunk_memory_ids

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
        if query:
            vector_res = await embed(query)
            vector: list[float] = vector_res[0] if isinstance(vector_res[0], list) else vector_res  # type: ignore
        else:
            vector: list[float] = [0.0] * 1536  # type: ignore

        if not isinstance(vector, list) or (vector and isinstance(vector[0], list)):
            vector = list(vector)  # type: ignore

        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None

        return await self.repo.match_memories(vector, 0.0, TOP_K, u_id, a_id, r_id)  # type: ignore
