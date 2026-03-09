"""Memory layer: embed, store, and retrieve user memories using Supabase pgvector.

Embeddings are produced via OpenRouter's OpenAI-compatible embedding endpoint
(default: ``openai/text-embedding-3-small``, 1536 dimensions).

This module also maintains a graph of memory relationships in Neo4j for enhanced
contextual retrieval and reasoning.
"""

from __future__ import annotations

import uuid
from typing import Any, cast

from app.database import get_supabase
from app.graph import (
    create_memory_node,
    create_relationship,
    find_related_memories,
)
from app.openrouter import embed as openrouter_embed

TOP_K = 5  # number of memories to retrieve per message


async def embed(text: str) -> list[float]:
    """Return an embedding vector for *text* via OpenRouter."""
    return await openrouter_embed(text)


async def store_memory(content: str, related_to: list[str] | None = None) -> str:
    """Embed *content* and persist it in both Supabase and Neo4j.

    Args:
        content: The memory content to store
        related_to: Optional list of memory IDs to create relationships with

    Returns:
        The generated memory ID
    """
    vector = await embed(content)
    memory_id = str(uuid.uuid4())

    # Store in Supabase (vector database)
    supabase = get_supabase()
    supabase.table("memories").insert(
        {"id": memory_id, "content": content, "embedding": vector}
    ).execute()

    # Store in Neo4j (graph database)
    await create_memory_node(memory_id, content, vector)

    # Create relationships if specified
    if related_to:
        for related_id in related_to:
            await create_relationship(memory_id, related_id, "RELATED_TO")

    return memory_id


async def _search_memories_by_vector(query: str, count: int = TOP_K) -> list[dict[str, Any]]:
    """Helper to embed a query and search Supabase pgvector for similar memories."""
    vector = await embed(query)
    supabase = get_supabase()
    response = supabase.rpc(
        "match_memories",
        {"query_embedding": vector, "match_threshold": 0.0, "match_count": count},
    ).execute()
    return cast("list[dict[str, Any]]", response.data)


async def retrieve_memories(query: str) -> list[str]:
    """Return the top-K memories most similar to *query* via cosine ANN search."""
    data = await _search_memories_by_vector(query)
    return [cast("str", r["content"]) for r in data]


async def retrieve_memories_with_graph(query: str) -> dict:
    """Return memories with their graph relationships.

    Combines vector similarity search with graph traversal to provide
    contextual memory retrieval.

    Args:
        query: The search query

    Returns:
        Dictionary with direct matches and related memories from graph
    """
    data = await _search_memories_by_vector(query)

    direct_matches = [cast("str", r["content"]) for r in data]
    graph_context = []

    for record in data:
        memory_id = record.get("id")
        if memory_id:
            # Find related memories via graph
            related = await find_related_memories(str(memory_id), depth=1)
            graph_context.append(
                {
                    "memory": record["content"],
                    "related_memories": [r["content"] for r in related],
                }
            )

    return {"direct_matches": direct_matches, "graph_context": graph_context}


async def find_similar_memories_in_graph(memory_id: str) -> list[str]:
    """Find memories similar to a given memory using graph relationships.

    Args:
        memory_id: The memory ID to find similar memories for

    Returns:
        List of related memory contents
    """
    related = await find_related_memories(memory_id)
    return [r["content"] for r in related]


async def link_memories(
    memory_id_1: str, memory_id_2: str, relation_type: str = "SIMILAR_TO"
) -> None:
    """Create a relationship between two existing memories.

    Args:
        memory_id_1: First memory ID
        memory_id_2: Second memory ID
        relation_type: Type of relationship (e.g., SIMILAR_TO, CONTRADICTS, FOLLOWS)
    """
    await create_relationship(memory_id_1, memory_id_2, relation_type)


async def initialize_graph_connections() -> None:
    """Initialize graph by creating relationships between similar memories.

    This can be called periodically to update the graph based on
    vector similarity scores.
    """
    supabase = get_supabase()

    # Get all memories
    response = supabase.table("memories").select("id, content, embedding").execute()
    memories = response.data

    # Create relationships based on embedding similarity
    # (This is a simplified version - in production you'd use a more efficient algorithm)
    for i, first_memory in enumerate(memories):
        for second_memory in memories[i + 1 :]:
            if not isinstance(first_memory, dict) or not isinstance(second_memory, dict):
                continue
            # Calculate cosine similarity
            first_embedding = cast("list[float]", first_memory.get("embedding", []))
            second_embedding = cast("list[float]", second_memory.get("embedding", []))

            if first_embedding and second_embedding:
                similarity = _cosine_similarity(first_embedding, second_embedding)
                if similarity > 0.85:  # High similarity threshold
                    await create_relationship(
                        cast("str", first_memory["id"]),
                        cast("str", second_memory["id"]),
                        "SIMILAR_TO",
                        {"similarity": similarity},
                    )


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    import math

    dot_product = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)
