"""Neo4j graph database client for storing memory relationships."""

from __future__ import annotations

from typing import Any

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.config import get_settings

_driver: AsyncDriver | None = None


async def get_neo4j_driver() -> AsyncDriver:
    """Return the Neo4j driver singleton."""
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            get_settings().neo4j_uri,
            auth=(get_settings().neo4j_user, get_settings().neo4j_password),
        )
    return _driver


async def close_neo4j_driver() -> None:
    """Close the Neo4j driver connection."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


async def create_memory_node(
    memory_id: str, content: str, embedding: list[float] | None = None
) -> None:
    """Create a Memory node in Neo4j.

    Args:
        memory_id: Unique identifier for the memory
        content: The memory content
        embedding: Optional vector embedding of the content
    """
    driver = await get_neo4j_driver()
    async with driver.session() as session:
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
    from_memory_id: str,
    to_memory_id: str,
    relation_type: str = "RELATED_TO",
    properties: dict[str, Any] | None = None,
) -> None:
    """Create a relationship between two memories.

    Args:
        from_memory_id: Source memory ID
        to_memory_id: Target memory ID
        relation_type: Type of relationship (e.g., RELATED_TO, SIMILAR_TO, FOLLOWS)
        properties: Optional relationship properties
    """
    driver = await get_neo4j_driver()
    relationship_properties = properties or {}

    async with driver.session() as session:
        await session.run(
            f"""
            MATCH (from:Memory {{id: $from_id}})
            MATCH (to:Memory {{id: $to_id}})
            CREATE (from)-[r:{relation_type} $relationship_properties]->(to)
            SET r.created_at = datetime()
            """,
            from_id=from_memory_id,
            to_id=to_memory_id,
            relationship_properties=relationship_properties,
        )


async def find_related_memories(
    memory_id: str,
    relation_type: str | None = None,
    depth: int = 1,
) -> list[dict[str, Any]]:
    """Find memories related to a given memory.

    Args:
        memory_id: The memory ID to search from
        relation_type: Optional specific relationship type to follow
        depth: How many hops to traverse (default: 1)

    Returns:
        List of related memories with relationship info
    """
    driver = await get_neo4j_driver()

    relation_filter = f"[:{relation_type}]" if relation_type else ""

    async with driver.session() as session:
        result = await session.run(
            f"""
            MATCH (m:Memory {{id: $memory_id}})-{relation_filter}-(related:Memory)
            RETURN related.id as id,
                   related.content as content,
                   related.created_at as created_at
            LIMIT 10
            """,
            memory_id=memory_id,
        )
        return [related_node.data() async for related_node in result]


async def search_memories_by_content(search_query: str) -> list[dict[str, Any]]:
    """Search memories by content (full-text search).

    Args:
        search_query: Search query string

    Returns:
        List of matching memories
    """
    driver = await get_neo4j_driver()

    async with driver.session() as session:
        result = await session.run(
            """
            CALL db.index.fulltext.queryNodes('memoryContent', $search_query)
            YIELD node, score
            RETURN node.id as id, node.content as content, score
            LIMIT 10
            """,
            {"search_query": search_query},
        )
        return [related_node.data() async for related_node in result]


async def create_conversation_turn(
    conversation_id: str,
    turn_number: int,
    role: str,
    content: str,
) -> None:
    """Create a conversation turn node linked to memories.

    Args:
        conversation_id: Unique conversation identifier
        turn_number: Sequential turn number in conversation
        role: 'user' or 'assistant'
        content: The message content
    """
    driver = await get_neo4j_driver()

    async with driver.session() as session:
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
    conversation_id: str,
    turn_number: int,
    memory_id: str,
) -> None:
    """Link a conversation turn to a memory.

    Args:
        conversation_id: Conversation identifier
        turn_number: Turn number to link
        memory_id: Memory ID to link to
    """
    driver = await get_neo4j_driver()

    async with driver.session() as session:
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


async def get_conversation_context(
    conversation_id: str,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Get full conversation with referenced memories.

    Args:
        conversation_id: The conversation to retrieve
        limit: Maximum number of turns

    Returns:
        List of conversation turns with referenced memories
    """
    driver = await get_neo4j_driver()

    async with driver.session() as session:
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
        return [related_node.data() async for related_node in result]
