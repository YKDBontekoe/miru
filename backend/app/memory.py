"""Memory layer: embed, store, and retrieve user memories using Supabase pgvector.

Embeddings are produced via OpenRouter's OpenAI-compatible embedding endpoint
(configured via ``settings.embedding_model``).

Storage policy
--------------
The LLM itself decides what is worth remembering. After each exchange,
``extract_memory`` asks the configured chat model to extract a concise,
third-person memory fact from the conversation turn. If there is nothing
worth storing the model returns an empty response and no write occurs.
This avoids brittle regex heuristics and lets the model's own understanding
determine what constitutes a meaningful personal detail.

Semantic deduplication is still applied after extraction: if a near-identical
memory already exists (cosine similarity >= ``DEDUP_THRESHOLD``) the new
content is discarded to prevent redundant entries.
"""

from __future__ import annotations

import logging
from typing import Any, cast

from app.database import get_supabase
from app.graph import (
    create_memory_node,
    create_relationship,
    find_related_memories,
)
from app.openrouter import chat_completion
from app.openrouter import embed as openrouter_embed

logger = logging.getLogger(__name__)

TOP_K = 5  # memories returned per retrieval query
DEDUP_THRESHOLD = 0.97  # cosine similarity above which we skip insert

_EXTRACTION_SYSTEM_PROMPT = """\
You are a memory extraction assistant. Given a conversation exchange between a \
user and Miru (an AI assistant), extract a single concise memory fact about the \
user that is worth remembering for future conversations.

Rules:
- Only extract something if the user reveals a personal detail, preference, \
  goal, opinion, or fact about themselves.
- Write the memory as a short, third-person statement about the user, \
  e.g. "The user enjoys hiking on weekends."
- If there is nothing personal or meaningful to remember, respond with exactly: \
  NOTHING
- Do not include anything else in your response — just the memory fact or NOTHING.\
"""


async def _extract_memory_content(user_message: str, assistant_reply: str) -> str | None:
    """Ask the LLM to extract a memory fact from the exchange.

    Returns the extracted memory string, or ``None`` if the model decides
    there is nothing worth storing.
    """
    prompt = (
        f"User: {user_message}\n"
        f"Miru: {assistant_reply}\n\n"
        "Extract a memory fact about the user from this exchange, or respond with NOTHING."
    )
    messages = [
        {"role": "system", "content": _EXTRACTION_SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    try:
        result = await chat_completion(messages)
    except Exception as exc:
        logger.warning("Memory extraction LLM call failed: %s", exc)
        return None

    result = result.strip()
    if not result or result.upper() == "NOTHING":
        logger.debug("Memory extraction: nothing to store for message: %.60s", user_message)
        return None

    logger.debug("Memory extracted: %s", result)
    return result


async def embed(text: str) -> list[float]:
    """Return an embedding vector for *text* via OpenRouter."""
    return await openrouter_embed(text)


async def store_memory(
    user_message: str,
    assistant_reply: str,
    related_to: list[str] | None = None,
) -> str | None:
    """Extract and persist a memory from a conversation exchange.

    The LLM first decides whether the exchange contains anything worth
    remembering and distils it into a concise fact. If there is nothing to
    store, returns ``None`` immediately without any database write.

    Semantic deduplication is applied before the final insert.

    Args:
        user_message: The raw user message from the exchange.
        assistant_reply: The full assistant response to the user.
        related_to: Optional list of memory IDs to link in Neo4j.

    Returns:
        The assigned memory ID, or ``None`` if nothing was stored.
    """
    content = await _extract_memory_content(user_message, assistant_reply)
    if content is None:
        return None

    vector = await embed(content)

    # Semantic deduplication — skip if a near-identical memory exists.
    supabase = get_supabase()
    existing = supabase.rpc(
        "match_memories",
        {
            "query_embedding": vector,
            "match_threshold": DEDUP_THRESHOLD,
            "match_count": 1,
        },
    ).execute()

    existing_data = cast("list[dict[str, Any]]", existing.data)
    if existing_data:
        logger.debug(
            "Skipping memory (duplicate, similarity=%.3f): %.60s",
            existing_data[0].get("similarity", 0),
            content,
        )
        return None

    # Insert — let the DB assign the uuid primary key.
    response = (
        supabase.table("memories").insert({"content": content, "embedding": vector}).execute()
    )

    memory_id = cast("str", cast("list[dict[str, Any]]", response.data)[0]["id"])
    logger.info("Stored memory %s: %.80s", memory_id, content)

    # Mirror in Neo4j graph.
    try:
        await create_memory_node(memory_id, content, vector)
        if related_to:
            for related_id in related_to:
                await create_relationship(memory_id, related_id, "RELATED_TO")
    except Exception as exc:
        # Graph write failure is non-fatal; vector store already succeeded.
        logger.warning("Neo4j write failed for memory %s: %s", memory_id, exc)

    return memory_id


async def _search_memories_by_vector(query: str, count: int = TOP_K) -> list[dict[str, Any]]:
    """Embed *query* and search Supabase pgvector for the closest memories."""
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
    """Return memories combined with their Neo4j graph relationships."""
    data = await _search_memories_by_vector(query)
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
