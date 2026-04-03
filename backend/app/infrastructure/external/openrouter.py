"""OpenRouter external API client with Instructor support."""

from __future__ import annotations

import asyncio
import logging
import typing
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

    async def chat_completion(self, messages: list[ChatCompletionMessageParam], model: str, accept_language: str | None = None) -> str:
        # Internally enforce strict JSON structured output even for generic strings
        structured_resp = await self.structured_completion(messages, model, ChatResponse, accept_language=accept_language)
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
        response = await self.openai_client.embeddings.create(
            model=model,
            input=text,
            encoding_format="float",
        )
        return response.data[0].embedding

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
        self, messages: list[ChatCompletionMessageParam], model: str, accept_language: str | None = None
    ) -> typing.AsyncIterator[typing.Any]:
        if accept_language:
            messages = [typing.cast("ChatCompletionMessageParam", {
                "role": "system",
                "content": f"Please respond in the locale corresponding to the Accept-Language header: {accept_language}."
            })] + messages
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
        accept_language: str | None = None,
    ) -> T:
        if accept_language:
            messages = [typing.cast("ChatCompletionMessageParam", {
                "role": "system",
                "content": f"Please respond in the locale corresponding to the Accept-Language header: {accept_language}."
            })] + messages
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
    messages: list[ChatCompletionMessageParam], model: str | None = None, accept_language: str | None = None
) -> str:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    try:
        return await client.chat_completion(messages, chosen_model, accept_language=accept_language)
    except Exception as e:
        if isinstance(e, asyncio.CancelledError):
            raise
        fallback = get_settings().fallback_chat_model
        if fallback and fallback != chosen_model:
            logger.warning(
                "chat_completion failed with model %s, falling back to %s", chosen_model, fallback
            )
            try:
                return await client.chat_completion(messages, fallback, accept_language=accept_language)
            except Exception as fallback_e:
                raise fallback_e from e
        raise


async def stream_chat(
    messages: list[ChatCompletionMessageParam], model: str | None = None, accept_language: str | None = None
) -> typing.AsyncIterator[typing.Any]:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    return await client.stream_chat(messages, chosen_model, accept_language=accept_language)


async def structured_completion(
    messages: list[ChatCompletionMessageParam],
    response_model: type[T],
    model: str | None = None,
    accept_language: str | None = None,
) -> T:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    try:
        return await client.structured_completion(messages, chosen_model, response_model, accept_language=accept_language)
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
                return await client.structured_completion(messages, fallback, response_model, accept_language=accept_language)
            except Exception as fallback_e:
                raise fallback_e from e
        raise


async def embed(text: str) -> list[float]:
    client = get_openrouter_client()
    return await client.embed(text, get_settings().embedding_model)
