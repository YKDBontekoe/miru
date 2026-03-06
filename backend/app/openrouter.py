"""OpenRouter SDK integration.

Uses the official ``openrouter`` Python SDK (``pip install openrouter``).
Provides three public helpers consumed by the rest of the application:

- :func:`get_client` — returns a lazily-initialised :class:`openrouter.OpenRouter`
  context-manager client.
- :func:`list_models` — fetches the OpenRouter model catalogue.
- :func:`embed` — generates a text embedding vector.
- :func:`stream_chat` — async generator that yields streaming chat tokens.
- :func:`chat_completion` — non-streaming full response (used by CrewAI agents).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from openrouter import OpenRouter
from openrouter.operations import CreateEmbeddingsResponseBody

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

from app.config import settings

# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------

_client: OpenRouter | None = None


def get_client() -> OpenRouter:
    """Return a lazily-initialised OpenRouter SDK client."""
    global _client
    if _client is None:
        _client = OpenRouter(
            api_key=settings.openrouter_api_key,
            http_referer="https://github.com/miru-app/miru",
            x_title="Miru AI Assistant",
        )
    return _client


# ---------------------------------------------------------------------------
# Model catalogue
# ---------------------------------------------------------------------------


async def list_models() -> list[dict]:
    """Return models available on OpenRouter, sorted by ID.

    Each entry contains ``id``, ``name``, ``context_length``,
    ``description``, and ``pricing``.
    """
    client = get_client()
    response = await client.models.list_async()

    models: list[dict] = []
    for m in response.data:
        models.append(
            {
                "id": m.id,
                "name": m.name,
                "context_length": m.context_length,
                "description": m.description or "",
                "pricing": {
                    "prompt": m.pricing.prompt,
                    "completion": m.pricing.completion,
                },
            }
        )

    return sorted(models, key=lambda m: m["id"])


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------


async def embed(text: str) -> list[float]:
    """Return an embedding vector for *text* via OpenRouter.

    Uses the model configured in ``settings.embedding_model``
    (default: ``openai/text-embedding-3-small``, 1536 dimensions).
    """
    client = get_client()
    response = await client.embeddings.generate_async(
        model=settings.embedding_model,
        input=text,
        encoding_format="float",
    )

    if isinstance(response, CreateEmbeddingsResponseBody):
        embedding = response.data[0].embedding
        # SDK typing: embedding is Union[List[float], str]; we requested "float"
        if isinstance(embedding, list):
            return embedding
        raise ValueError(f"Unexpected embedding format: {type(embedding)}")

    raise ValueError(f"Unexpected embeddings response type: {type(response)}")


# ---------------------------------------------------------------------------
# Streaming chat
# ---------------------------------------------------------------------------


async def stream_chat(
    messages: list[dict],
    model: str | None = None,
) -> AsyncIterator[str]:
    """Async generator that yields chat completion text chunks from OpenRouter.

    Args:
        messages: List of ``{"role": ..., "content": ...}`` dicts.
        model: OpenRouter model ID (e.g. ``"anthropic/claude-3.5-sonnet"``).
               Falls back to ``settings.default_chat_model`` when ``None``.

    Yields:
        Individual text delta strings as they arrive.
    """
    client = get_client()
    chosen_model = model or settings.default_chat_model

    event_stream = await client.chat.send_async(
        model=chosen_model,
        messages=messages,  # type: ignore[call-overload]
        stream=True,
    )

    async with event_stream as stream:
        async for chunk in stream:
            if chunk.choices:
                content = chunk.choices[0].delta.content
                # content is OptionalNullable[str]; skip UNSET / None
                if content and isinstance(content, str):
                    yield content


# ---------------------------------------------------------------------------
# Non-streaming chat (used by CrewAI agents)
# ---------------------------------------------------------------------------


async def chat_completion(
    messages: list[dict],
    model: str | None = None,
) -> str:
    """Return the full assistant reply as a string (non-streaming).

    Intended for internal use by CrewAI agent tasks.
    """
    client = get_client()
    chosen_model = model or settings.default_chat_model

    response = await client.chat.send_async(
        model=chosen_model,
        messages=messages,  # type: ignore[call-overload]
        stream=False,
    )

    content = response.choices[0].message.content
    if isinstance(content, str):
        return content
    return ""
