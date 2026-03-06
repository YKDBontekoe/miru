"""Memory layer: embed, store, and retrieve user memories using Supabase pgvector.

Embeddings are produced via OpenRouter's OpenAI-compatible embedding endpoint
(default: ``openai/text-embedding-3-small``, 1536 dimensions).

This module also maintains a graph of memory relationships in Neo4j for enhanced
contextual retrieval and reasoning.
"""

from __future__ import annotations

import uuid

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


async def retrieve_memories(query: str) -> list[str]:
    """Return the top-K memories most similar to *query* via cosine ANN search."""
    vector = await embed(query)
    supabase = get_supabase()
    # Use RPC function for vector similarity search
    response = supabase.rpc(
        "match_memories",
        {"query_embedding": vector, "match_threshold": 0.0, "match_count": TOP_K},
    ).execute()
    return [r["content"] for r in response.data]


async def retrieve_memories_with_graph(query: str) -> dict:
    """Return memories with their graph relationships.

    Combines vector similarity search with graph traversal to provide
    contextual memory retrieval.

    Args:
        query: The search query

    Returns:
        Dictionary with direct matches and related memories from graph
    """
    # Get vector-based matches from Supabase
    direct_matches = await retrieve_memories(query)

    # For each match, find related memories in graph
    graph_context = []
    supabase = get_supabase()
    vector = await embed(query)
    response = supabase.rpc(
        "match_memories",
        {"query_embedding": vector, "match_threshold": 0.0, "match_count": TOP_K},
    ).execute()

    for record in response.data:
        memory_id = record.get("id")
        if memory_id:
            # Find related memories via graph
            related = await find_related_memories(memory_id, depth=1)
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
    for i, mem1 in enumerate(memories):
        for mem2 in memories[i + 1 :]:
            # Calculate cosine similarity
            emb1 = mem1.get("embedding", [])
            emb2 = mem2.get("embedding", [])

            if emb1 and emb2:
                similarity = _cosine_similarity(emb1, emb2)
                if similarity > 0.85:  # High similarity threshold
                    await create_relationship(
                        mem1["id"], mem2["id"], "SIMILAR_TO", {"similarity": similarity}
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
