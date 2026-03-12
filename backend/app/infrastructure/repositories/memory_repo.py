"""Memory repository for SQLModel and Neo4j operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.domain.memory.models import Memory

if TYPE_CHECKING:
    from neo4j import AsyncDriver
    from sqlmodel.ext.asyncio.session import AsyncSession


class MemoryRepository:
    def __init__(self, session: AsyncSession, graph: AsyncDriver):
        self.session = session
        self.graph = graph

    # --- SQLModel (Vector Store) Operations ---

    async def insert_memory(self, memory: Memory) -> Memory:
        """Insert a new memory record."""
        self.session.add(memory)
        await self.session.commit()
        await self.session.refresh(memory)
        return memory

    # --- Neo4j (Graph) Operations ---

    async def create_node(
        self, memory_id: UUID, content: str, embedding: list[float] | None = None
    ) -> None:
        """Create a Memory node in Neo4j."""
        async with self.graph.session() as session:
            await session.run(
                """
                CREATE (m:Memory {
                    id: $memory_id,
                    content: $content,
                    created_at: datetime(),
                    embedding: $embedding
                })
                """,
                memory_id=str(memory_id),
                content=content,
                embedding=embedding,
            )

    async def create_relationship(
        self,
        from_id: UUID,
        to_id: UUID,
        rel_type: str = "RELATED_TO",
    ) -> None:
        """Create a relationship between two memories."""
        async with self.graph.session() as session:
            await session.run(
                f"""
                MATCH (from:Memory {{id: $from_id}})
                MATCH (to:Memory {{id: $to_id}})
                CREATE (from)-[r:{rel_type}]->(to)
                SET r.created_at = datetime()
                """,
                from_id=str(from_id),
                to_id=str(to_id),
            )
