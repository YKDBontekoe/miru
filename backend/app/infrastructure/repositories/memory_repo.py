"""Memory repository for Supabase and Neo4j operations."""

from __future__ import annotations

from typing import Any, cast
from uuid import UUID

from neo4j import AsyncDriver
from supabase import Client


class MemoryRepository:
    def __init__(self, db: Client, graph: AsyncDriver):
        self.db = db
        self.graph = graph

    # --- Supabase (Vector Store) Operations ---

    async def match_memories(
        self,
        vector: list[float],
        threshold: float,
        count: int,
        user_id: str | None = None,
        agent_id: str | None = None,
        room_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Search for memories by vector similarity."""
        rpc_params = {
            "query_embedding": vector,
            "match_threshold": threshold,
            "match_count": count,
            "p_user_id": user_id,
            "p_agent_id": agent_id,
            "p_room_id": room_id,
        }
        response = self.db.rpc("match_memories", rpc_params).execute()
        return cast("list[dict[str, Any]]", response.data)

    async def insert_memory(self, data: dict[str, Any]) -> str:
        """Insert a new memory record."""
        response = self.db.table("memories").insert(data).execute()
        return cast("str", cast("list[dict[str, Any]]", response.data)[0]["id"])

    # --- Neo4j (Graph) Operations ---

    async def create_node(
        self, memory_id: str, content: str, embedding: list[float] | None = None
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
                memory_id=memory_id,
                content=content,
                embedding=embedding,
            )

    async def create_relationship(
        self,
        from_id: str,
        to_id: str,
        rel_type: str = "RELATED_TO",
        properties: dict[str, Any] | None = None,
    ) -> None:
        """Create a relationship between two memories."""
        props = properties or {}
        async with self.graph.session() as session:
            await session.run(
                f"""
                MATCH (from:Memory {{id: $from_id}})
                MATCH (to:Memory {{id: $to_id}})
                CREATE (from)-[r:{rel_type} $props]->(to)
                SET r.created_at = datetime()
                """,
                from_id=from_id,
                to_id=to_id,
                props=props,
            )

    async def find_related(self, memory_id: str, rel_type: str | None = None) -> list[dict[str, Any]]:
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
                memory_id=memory_id,
            )
            return [node.data() async for node in result]

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
        self, conversation_id: str, turn_number: int, role: str, content: str
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
                conversation_id=conversation_id,
                turn_number=turn_number,
                role=role,
                content=content,
            )

    async def link_turn_to_memory(
        self, conversation_id: str, turn_number: int, memory_id: str
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
                conversation_id=conversation_id,
                turn_number=turn_number,
                memory_id=memory_id,
            )

    async def get_conversation_context(self, conversation_id: str, limit: int = 10) -> list[dict[str, Any]]:
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
                conversation_id=conversation_id,
                limit=limit,
            )
            return [node.data() async for node in result]

    async def get_relationships_subgraph(self, memory_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch relationships between a set of memory IDs."""
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
                memory_ids=memory_ids,
            )
            return [record.data() async for record in result]
