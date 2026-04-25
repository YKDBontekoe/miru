"""OpenRouter external API client with Instructor support."""

from __future__ import annotations

import asyncio
import hashlib
import logging
import typing
from collections import OrderedDict
from typing import TYPE_CHECKING, TypeVar

import openai
from pydantic import BaseModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam

T = TypeVar("T", bound=BaseModel)


class ChatResponse(BaseModel):
    """Fallback generic Pydantic schema for non-structured chat outputs."""

    message: str


class LRUCache:
    """A simple dictionary-based LRU cache for async methods.

    This cache limits its size and ejects the least recently used entry
    when maxsize is exceeded.
    """

    def __init__(self, maxsize: int = 100):
        self.cache: OrderedDict[str, typing.Any] = OrderedDict()
        self.maxsize = maxsize

    def get(self, key: str) -> typing.Any | None:
        """Retrieve an item from the cache.

        Args:
            key: The key used to identify the cached value.

        Returns:
            The cached value if present, or None.
        """
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return None

    def set(self, key: str, value: typing.Any) -> None:
        """Store an item in the cache.

        Args:
            key: The key to associate with the value.
            value: The value to store.
        """
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)


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
            mode=instructor.Mode.OPENROUTER_STRUCTURED_OUTPUTS,
        )
        # Initialize an LRU cache for semantic deduplication (e.g. embeddings)
        self._embed_cache = LRUCache(maxsize=100)
        self._embed_inflight: dict[str, asyncio.Future] = {}

    async def chat_completion(self, messages: list[ChatCompletionMessageParam], model: str) -> str:
        # Internally enforce strict JSON structured output even for generic strings
        structured_resp = await self.structured_completion(messages, model, ChatResponse)
        return structured_resp.message

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(
            (
                openai.APIConnectionError,
                openai.RateLimitError,
                openai.InternalServerError,
                openai.APITimeoutError,
            )
        ),
        reraise=True,
    )
    async def embed(self, text: str, model: str) -> list[float]:
        text_digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        cache_key = f"{model}:{text_digest}"

        cached_val = self._embed_cache.get(cache_key)
        if cached_val is not None:
            return typing.cast("list[float]", cached_val)

        if cache_key in self._embed_inflight:
            return await self._embed_inflight[cache_key]

        future: asyncio.Future = asyncio.Future()
        self._embed_inflight[cache_key] = future

        try:
            response = await self.openai_client.embeddings.create(
                model=model,
                input=text,
                encoding_format="float",
            )
            embedding = response.data[0].embedding
            self._embed_cache.set(cache_key, embedding)
            future.set_result(embedding)
            return embedding
        except Exception as e:
            future.set_exception(e)
            raise
        finally:
            self._embed_inflight.pop(cache_key, None)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(
            (
                openai.APIConnectionError,
                openai.RateLimitError,
                openai.InternalServerError,
                openai.APITimeoutError,
            )
        ),
        reraise=True,
    )
    async def stream_chat(
        self, messages: list[ChatCompletionMessageParam], model: str
    ) -> typing.AsyncIterator[typing.Any]:
        return await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(
            (
                openai.APIConnectionError,
                openai.RateLimitError,
                openai.InternalServerError,
                openai.APITimeoutError,
            )
        ),
        reraise=True,
    )
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


# Singleton client for internal use
_client: OpenRouterClient | None = None


def get_openrouter_client() -> OpenRouterClient:
    global _client
    if _client is None:
        _client = OpenRouterClient(get_settings().openrouter_api_key)
    return _client


async def chat_completion(
    messages: list[ChatCompletionMessageParam], model: str | None = None
) -> str:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    try:
        return await client.chat_completion(messages, chosen_model)
    except Exception as e:
        if isinstance(e, asyncio.CancelledError):
            raise
        fallback = get_settings().fallback_chat_model
        if fallback and fallback != chosen_model:
            logger.warning(
                "chat_completion failed with model %s, falling back to %s", chosen_model, fallback
            )
            try:
                return await client.chat_completion(messages, fallback)
            except Exception as fallback_e:
                raise fallback_e from e
        raise


async def stream_chat(
    messages: list[ChatCompletionMessageParam], model: str | None = None
) -> typing.AsyncIterator[typing.Any]:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    return await client.stream_chat(messages, chosen_model)


async def structured_completion(
    messages: list[ChatCompletionMessageParam],
    response_model: type[T],
    model: str | None = None,
) -> T:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    try:
        return await client.structured_completion(messages, chosen_model, response_model)
    except Exception as e:
        if isinstance(e, asyncio.CancelledError):
            raise
        fallback = get_settings().fallback_chat_model
        if fallback and fallback != chosen_model:
            logger.warning(
                "structured_completion failed with model %s, falling back to %s",
                chosen_model,
                fallback,
            )
            try:
                return await client.structured_completion(messages, fallback, response_model)
            except Exception as fallback_e:
                raise fallback_e from e
        raise


async def embed(text: str) -> list[float]:
    client = get_openrouter_client()
    return await client.embed(text, get_settings().embedding_model)
