"""Memory repository for SQLModel and Neo4j operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import text
from sqlmodel import select

from app.domain.memory.models import Memory, MemoryRelationship

if TYPE_CHECKING:
    from uuid import UUID

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

    async def delete_memory(self, memory_id: UUID) -> bool:
        """Delete a memory from both SQLModel and Neo4j."""
        # 1. SQLModel Delete
        memory = await self.session.get(Memory, memory_id)
        if memory:
            await self.session.delete(memory)
            await self.session.commit()

        # 2. Neo4j Delete
        async with self.graph.session() as session:
            await session.run(
                "MATCH (m:Memory {id: $memory_id}) DETACH DELETE m",
                memory_id=str(memory_id),
            )
        return memory is not None

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
            "p_user_id": user_id,
            "p_agent_id": agent_id,
            "p_room_id": room_id,
        }
        result = await self.session.execute(statement, params)
        return [Memory(**row) for row in result.mappings()]

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

    async def find_related(self, memory_id: UUID, rel_type: str | None = None) -> list[Memory]:
        """Find related memories in the graph."""
        rel_filter = f"[:{rel_type}]" if rel_type else ""
        async with self.graph.session() as session:
            result = await session.run(
                f"""
                MATCH (m:Memory {{id: $memory_id}})-{rel_filter}-(related:Memory)
                RETURN related.id as id,
                       related.content as content,
                       related.created_at as created_at
                LIMIT 10
                """,
                memory_id=str(memory_id),
            )
            return [Memory(**node.data()) async for node in result]

    async def search_fulltext(self, query: str) -> list[dict[str, Any]]:
        """Full-text search for memories in Neo4j."""
        async with self.graph.session() as session:
            result = await session.run(
                """
                CALL db.index.fulltext.queryNodes('memoryContent', $query)
                YIELD node, score
                RETURN node.id as id, node.content as content, score
                LIMIT 10
                """,
                {"query": query},
            )
            return [node.data() async for node in result]

    async def create_turn(
        self, conversation_id: UUID, turn_number: int, role: str, content: str
    ) -> None:
        """Create a conversation turn node."""
        async with self.graph.session() as session:
            await session.run(
                """
                CREATE (t:ConversationTurn {
                    conversation_id: $conversation_id,
                    turn_number: $turn_number,
                    role: $role,
                    content: $content,
                    created_at: datetime()
                })
                """,
                conversation_id=str(conversation_id),
                turn_number=turn_number,
                role=role,
                content=content,
            )

    async def link_turn_to_memory(
        self, conversation_id: UUID, turn_number: int, memory_id: UUID
    ) -> None:
        """Link a turn to a memory."""
        async with self.graph.session() as session:
            await session.run(
                """
                MATCH (t:ConversationTurn {
                    conversation_id: $conversation_id,
                    turn_number: $turn_number
                })
                MATCH (m:Memory {id: $memory_id})
                CREATE (t)-[r:REFERENCES]->(m)
                """,
                conversation_id=str(conversation_id),
                turn_number=turn_number,
                memory_id=str(memory_id),
            )

    async def get_conversation_context(
        self, conversation_id: UUID, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Fetch conversation turns and linked memories."""
        async with self.graph.session() as session:
            result = await session.run(
                """
                MATCH (t:ConversationTurn {conversation_id: $conversation_id})
                OPTIONAL MATCH (t)-[:REFERENCES]->(m:Memory)
                RETURN t.turn_number as turn,
                       t.role as role,
                       t.content as content,
                       collect({id: m.id, content: m.content}) as memories
                ORDER BY t.turn_number
                LIMIT $limit
                """,
                conversation_id=str(conversation_id),
                limit=limit,
            )
            return [node.data() async for node in result]

    async def get_relationships_subgraph(self, memory_ids: list[UUID]) -> list[MemoryRelationship]:
        """Fetch relationships between a set of memory IDs."""
        ids_str = [str(mid) for mid in memory_ids]
        async with self.graph.session() as session:
            result = await session.run(
                """
                UNWIND $memory_ids AS memory_id
                MATCH (source:Memory {id: memory_id})-[r]-(target:Memory)
                WHERE target.id IN $memory_ids
                RETURN source.id AS source,
                       target.id AS target,
                       type(r) AS relationship_type
                """,
                memory_ids=ids_str,
            )
            return [MemoryRelationship(**record.data()) async for record in result]
