"""Memory layer: embed, store, and retrieve user memories using Supabase pgvector.

Embeddings are produced via OpenRouter's OpenAI-compatible embedding endpoint
(default: ``openai/text-embedding-3-small``, 1536 dimensions).
"""

from __future__ import annotations

from app.database import get_supabase
from app.openrouter import embed as openrouter_embed

TOP_K = 5  # number of memories to retrieve per message


async def embed(text: str) -> list[float]:
    """Return an embedding vector for *text* via OpenRouter."""
    return await openrouter_embed(text)


async def store_memory(content: str) -> None:
    """Embed *content* and persist it in the memories table."""
    vector = await embed(content)
    supabase = get_supabase()
    supabase.table("memories").insert({"content": content, "embedding": vector}).execute()


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
