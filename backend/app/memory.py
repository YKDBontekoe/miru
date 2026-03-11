"""Memory layer: embed, store, and retrieve user, agent, and room memories using Supabase pgvector.

Embeddings are produced via OpenRouter's OpenAI-compatible embedding endpoint
(configured via ``settings.embedding_model``).

Storage policy
--------------
The LLM itself decides what is worth remembering. After each exchange,
``extract_memory`` asks the configured chat model to extract a concise,
third-person memory fact from the conversation turn. If there is nothing
worth storing the model returns an empty response and no write occurs.
This avoids brittle regex heuristics and lets the model's own understanding
determine what constitutes a meaningful detail.

Semantic deduplication is still applied after extraction: if a near-identical
memory already exists (cosine similarity >= ``DEDUP_THRESHOLD``) the new
content is discarded to prevent redundant entries.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from uuid import UUID

from app.database import get_supabase
from app.graph import (
    create_memory_node,
    create_relationship,
    find_related_memories,
)
from app.openrouter import embed as openrouter_embed

logger = logging.getLogger(__name__)

TOP_K = 5  # memories returned per retrieval query
DEDUP_THRESHOLD = 0.97  # cosine similarity above which we skip insert

# _EXTRACTION_PROMPTS and _extract_memory_content removed. Memories are now explicitly extracted from agent outputs.


async def embed(text: str) -> list[float]:
    """Return an embedding vector for *text* via OpenRouter."""
    return await openrouter_embed(text)


async def store_memory(
    content: str,
    related_to: list[str] | None = None,
    user_id: UUID | str | None = None,
    agent_id: str | None = None,
    room_id: str | None = None,
) -> str | None:
    """Persist an explicit memory fact.

    Semantic deduplication is applied before the final insert.
    """
    content = content.strip()
    if not content:
        return None

    vector = await embed(content)

    supabase = get_supabase()
    rpc_params: dict[str, Any] = {
        "query_embedding": vector,
        "match_threshold": DEDUP_THRESHOLD,
        "match_count": 1,
        "p_user_id": str(user_id) if user_id is not None else None,
        "p_agent_id": agent_id if agent_id is not None else None,
        "p_room_id": room_id if room_id is not None else None,
    }

    existing = supabase.rpc("match_memories", rpc_params).execute()

    existing_data = cast("list[dict[str, Any]]", existing.data)
    if existing_data:
        logger.debug(
            "Skipping memory (duplicate, similarity=%.3f): %.60s",
            existing_data[0].get("similarity", 0),
            content,
        )
        return None

    insert_data: dict[str, Any] = {"content": content, "embedding": vector}
    if user_id is not None:
        insert_data["user_id"] = str(user_id)
    if agent_id is not None:
        insert_data["agent_id"] = agent_id
    if room_id is not None:
        insert_data["room_id"] = room_id

    response = supabase.table("memories").insert(insert_data).execute()

    memory_id = cast("str", cast("list[dict[str, Any]]", response.data)[0]["id"])
    logger.info("Stored memory %s: %.80s", memory_id, content)

    try:
        await create_memory_node(memory_id, content, vector)
        if related_to:
            for related_id in related_to:
                await create_relationship(memory_id, related_id, "RELATED_TO")
    except Exception as exc:
        logger.warning("Neo4j write failed for memory %s: %s", memory_id, exc)

    return memory_id


async def _search_memories_by_vector(
    query: str,
    query_vector: list[float] | None = None,
    count: int = TOP_K,
    user_id: UUID | str | None = None,
    agent_id: str | None = None,
    room_id: str | None = None,
) -> list[dict[str, Any]]:
    """Embed *query* and search Supabase pgvector for the closest memories."""
    vector = query_vector if query_vector is not None else await embed(query)
    supabase = get_supabase()
    rpc_params: dict[str, Any] = {
        "query_embedding": vector,
        "match_threshold": 0.0,
        "match_count": count,
        "p_user_id": str(user_id) if user_id is not None else None,
        "p_agent_id": agent_id if agent_id is not None else None,
        "p_room_id": room_id if room_id is not None else None,
    }

    response = supabase.rpc("match_memories", rpc_params).execute()
    return cast("list[dict[str, Any]]", response.data)


async def retrieve_memories(
    query: str | None = None,
    query_vector: list[float] | None = None,
    user_id: UUID | str | None = None,
    agent_id: str | None = None,
    room_id: str | None = None,
) -> list[str]:
    """Return the top-K memories most similar to *query* via cosine ANN search."""
    if query_vector is None:
        if not query:
            return []
        query_vector = await embed(query)

    supabase = get_supabase()
    rpc_params: dict[str, Any] = {
        "query_embedding": query_vector,
        "match_threshold": 0.0,
        "match_count": TOP_K,
        "p_user_id": str(user_id) if user_id is not None else None,
        "p_agent_id": agent_id if agent_id is not None else None,
        "p_room_id": room_id if room_id is not None else None,
    }

    response = supabase.rpc("match_memories", rpc_params).execute()
    data = cast("list[dict[str, Any]]", response.data)
    return [cast("str", r["content"]) for r in data]


async def retrieve_memories_with_graph(
    query: str,
    user_id: UUID | str | None = None,
    agent_id: str | None = None,
    room_id: str | None = None,
) -> dict:
    """Return memories combined with their Neo4j graph relationships."""
    data = await _search_memories_by_vector(
        query, user_id=user_id, agent_id=agent_id, room_id=room_id
    )
    direct_matches = [cast("str", r["content"]) for r in data]
    graph_context = []

    for record in data:
        memory_id = record.get("id")
        if memory_id:
            related = await find_related_memories(str(memory_id), depth=1)
            graph_context.append(
                {
                    "memory": record["content"],
                    "related_memories": [r["content"] for r in related],
                }
            )

    return {"direct_matches": direct_matches, "graph_context": graph_context}


async def link_memories(
    memory_id_1: str, memory_id_2: str, relation_type: str = "SIMILAR_TO"
) -> None:
    """Create a relationship between two existing memories."""
    await create_relationship(memory_id_1, memory_id_2, relation_type)
