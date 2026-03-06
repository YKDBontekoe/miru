"""Memory layer: embed, store, and retrieve user memories using pgvector."""
from __future__ import annotations

import numpy as np
from mistralai import Mistral

from app.config import settings
from app.database import get_pool

_mistral = Mistral(api_key=settings.mistral_api_key)

EMBED_MODEL = "mistral-embed"
CHAT_MODEL = "mistral-large-latest"
TOP_K = 5  # number of memories to retrieve per message


async def embed(text: str) -> list[float]:
    """Return a 1024-dim embedding for *text* using Mistral embed model."""
    response = _mistral.embeddings.create(
        model=EMBED_MODEL,
        inputs=[text],
    )
    return response.data[0].embedding


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
    """Return the top-K memories most similar to *query*."""
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


def get_mistral_client() -> Mistral:
    return _mistral
