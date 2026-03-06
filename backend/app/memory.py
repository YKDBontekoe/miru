"""Memory layer: embed, store, and retrieve user memories using pgvector.

Embeddings are produced via OpenRouter's OpenAI-compatible embedding endpoint
(default: ``openai/text-embedding-3-small``, 1536 dimensions).
"""

from __future__ import annotations

import numpy as np

from app.database import get_pool
from app.openrouter import embed as openrouter_embed

TOP_K = 5  # number of memories to retrieve per message


async def embed(text: str) -> list[float]:
    """Return an embedding vector for *text* via OpenRouter."""
    return await openrouter_embed(text)


async def store_memory(content: str) -> None:
    """Embed *content* and persist it in the memories table."""
    vector = await embed(content)
    pool = await get_pool()
    await pool.execute(
        "INSERT INTO memories (content, embedding) VALUES ($1, $2)",
        content,
        np.array(vector, dtype=np.float32),
    )


async def retrieve_memories(query: str) -> list[str]:
    """Return the top-K memories most similar to *query* via cosine ANN search."""
    vector = await embed(query)
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT content
        FROM   memories
        ORDER  BY embedding <=> $1
        LIMIT  $2
        """,
        np.array(vector, dtype=np.float32),
        TOP_K,
    )
    return [r["content"] for r in rows]
