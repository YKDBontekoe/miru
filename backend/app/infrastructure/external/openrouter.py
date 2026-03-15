"""OpenRouter external API client with Instructor support."""

from __future__ import annotations

import asyncio
import functools
import time
from typing import TYPE_CHECKING, TypeVar

from pydantic import BaseModel

from app.core.config import get_settings

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam

T = TypeVar("T", bound=BaseModel)

# Simple LRU cache with TTL for embeddings
_embed_cache: dict[tuple[str, str], tuple[list[float], float]] = {}
_EMBED_TTL_SECONDS = 300  # 5 minutes


def _embed_cache_get(text: str, model: str) -> list[float] | None:
    entry = _embed_cache.get((text, model))
    if entry and time.monotonic() - entry[1] < _EMBED_TTL_SECONDS:
        return entry[0]
    return None


def _embed_cache_set(text: str, model: str, value: list[float]) -> None:
    # Limit cache to 256 entries (evict oldest)
    if len(_embed_cache) >= 256:
        oldest_key = min(_embed_cache, key=lambda k: _embed_cache[k][1])
        del _embed_cache[oldest_key]
    _embed_cache[(text, model)] = (value, time.monotonic())


class OpenRouterClient:
    def __init__(self, api_key: str):
        # We defer imports to bypass Python 3.13 circular import bugs at startup
        import instructor
        from openai import AsyncOpenAI

        self.openai_client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/miru-app/miru",
                "X-Title": "Miru AI Assistant",
            },
        )
        self.instructor_client: instructor.AsyncInstructor = instructor.from_openai(
            self.openai_client,
            mode=instructor.Mode.MD_JSON,
        )

    async def embed(self, text: str, model: str) -> list[float]:
        cached = _embed_cache_get(text, model)
        if cached is not None:
            return cached
        response = await self.openai_client.embeddings.create(
            model=model,
            input=text,
            encoding_format="float",
        )
        result = response.data[0].embedding
        _embed_cache_set(text, model, result)
        return result

    async def chat_completion(self, messages: list[ChatCompletionMessageParam], model: str) -> str:
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False,
        )
        if not hasattr(response, "choices"):
            return ""
        content = response.choices[0].message.content
        return str(content) if content else ""

    async def structured_completion(
        self,
        messages: list[ChatCompletionMessageParam],
        model: str,
        response_model: type[T],
    ) -> T:
        return await self.instructor_client.chat.completions.create(
            model=model,
            messages=messages,
            response_model=response_model,
        )


# Thread-safe singleton using asyncio.Lock
_client: OpenRouterClient | None = None
_client_lock = asyncio.Lock()


async def _get_openrouter_client_async() -> OpenRouterClient:
    global _client
    if _client is None:
        async with _client_lock:
            if _client is None:
                _client = OpenRouterClient(get_settings().openrouter_api_key)
    return _client


def get_openrouter_client() -> OpenRouterClient:
    """Return the singleton OpenRouterClient. Creates it synchronously on first call."""
    global _client
    if _client is None:
        _client = OpenRouterClient(get_settings().openrouter_api_key)
    return _client


async def chat_completion(
    messages: list[ChatCompletionMessageParam], model: str | None = None
) -> str:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    return await client.chat_completion(messages, chosen_model)


async def structured_completion(
    messages: list[ChatCompletionMessageParam],
    response_model: type[T],
    model: str | None = None,
) -> T:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    return await client.structured_completion(messages, chosen_model, response_model)


async def embed(text: str) -> list[float]:
    client = get_openrouter_client()
    return await client.embed(text, get_settings().embedding_model)
