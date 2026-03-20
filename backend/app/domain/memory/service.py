"""Memory service for business logic and vector/graph integration."""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.domain.memory.models import Memory, MemoryCollection
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
        collection_id: UUID | str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[Memory]:
        """Fetch memories from the vector store or database depending on filters."""
        u_id = UUID(str(user_id)) if user_id else None
        a_id = UUID(str(agent_id)) if agent_id else None
        r_id = UUID(str(room_id)) if room_id else None
        c_id = UUID(str(collection_id)) if collection_id else None

        if query:
            if c_id and u_id:
                # If both fulltext query and specific collection are provided, use FTS to filter by collection
                return await self.repo.search_fulltext(query, u_id, collection_id=c_id)

            vector = await embed(query)
            return await self.repo.match_memories(vector, 0.0, TOP_K, u_id, a_id, r_id)

        # If no query, list memories with optional filters
        if not u_id:
            return []

        return await self.repo.list_all_memories(
            user_id=u_id,
            collection_id=c_id,
            start_date=start_date,
            end_date=end_date,
        )

    async def update_memory(self, memory_id: UUID, update_data: dict[str, Any]) -> Memory | None:
        """Update a memory's content or collection."""
        if "content" in update_data:
            update_data["embedding"] = await embed(update_data["content"])

        if "collection_id" in update_data and update_data["collection_id"] is not None:
            update_data["collection_id"] = UUID(str(update_data["collection_id"]))

        return await self.repo.update_memory(memory_id, update_data)

    async def get_on_this_day(self, user_id: UUID, limit: int = 10) -> list[Memory]:
        """Get memories from the same day in previous years."""
        return await self.repo.get_on_this_day(user_id, limit)

    # --- Collection Management ---

    async def create_collection(
        self, user_id: UUID, name: str, description: str | None = None
    ) -> MemoryCollection:
        """Create a new memory collection."""
        return await self.repo.create_collection(user_id, name, description)

    async def list_collections(self, user_id: UUID) -> list[MemoryCollection]:
        """List all collections for a user."""
        return await self.repo.list_collections(user_id)

    async def update_collection(
        self, collection_id: UUID, name: str | None = None, description: str | None = None
    ) -> MemoryCollection | None:
        """Update an existing collection."""
        return await self.repo.update_collection(collection_id, name, description)

    async def delete_collection(self, collection_id: UUID) -> bool:
        """Delete a collection."""
        return await self.repo.delete_collection(collection_id)

    # --- Actions ---

    async def merge_memories(
        self, user_id: UUID, memory_ids: list[UUID], new_content: str
    ) -> UUID | None:
        """Merge multiple memories into a single new memory."""
        new_id = await self.store_memory(content=new_content, user_id=user_id)
        if new_id:
            for m_id in memory_ids:
                await self.delete_memory(m_id)
        return new_id

    async def export_memories(self, user_id: UUID, format_type: str = "json") -> str:
        """Export all user memories to JSON or CSV format."""
        memories = await self.repo.list_all_memories(user_id, limit=10000)

        if format_type.lower() == "json":
            data = [
                {
                    "id": str(m.id),
                    "content": m.content,
                    "collection_id": str(m.collection_id)
                    if getattr(m, "collection_id", None)
                    else None,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                    "meta": m.meta,
                }
                for m in memories
            ]
            return json.dumps(data, indent=2)

        elif format_type.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["id", "content", "collection_id", "created_at"])
            for m in memories:
                writer.writerow(
                    [
                        str(m.id),
                        m.content,
                        str(m.collection_id) if getattr(m, "collection_id", None) else "",
                        m.created_at.isoformat() if m.created_at else "",
                    ]
                )
            return output.getvalue()

        return ""
