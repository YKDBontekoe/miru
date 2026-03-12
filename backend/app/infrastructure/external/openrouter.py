"""OpenRouter external API client."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from openrouter import OpenRouter
from openrouter.operations import CreateEmbeddingsResponseBody

from app.core.config import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

class OpenRouterClient:
    def __init__(self, api_key: str):
        self.client = OpenRouter(
            api_key=api_key,
            http_referer="https://github.com/miru-app/miru",
            x_title="Miru AI Assistant",
        )

    async def embed(self, text: str, model: str) -> list[float]:
        """Generate a text embedding vector."""
        response = await self.client.embeddings.generate_async(
            model=model,
            input=text,
            encoding_format="float",
        )
        if isinstance(response, CreateEmbeddingsResponseBody):
            embedding = response.data[0].embedding
            if isinstance(embedding, list):
                return embedding
        raise ValueError(f"Unexpected embeddings response: {type(response)}")

    async def stream_chat(
        self, messages: list[dict[str, Any]], model: str
    ) -> AsyncIterator[str]:
        """Stream chat completion chunks."""
        event_stream = await self.client.chat.send_async(
            model=model,
            messages=messages,
            stream=True,
        )
        async with event_stream as stream:
            async for chunk in stream:
                if chunk.choices:
                    content = chunk.choices[0].delta.content
                    if content and isinstance(content, str):
                        yield content

    async def chat_completion(
        self, messages: list[dict[str, Any]], model: str
    ) -> str:
        """Get a full chat completion response."""
        response = await self.client.chat.send_async(
            model=model,
            messages=messages,
            stream=False,
        )
        content = response.choices[0].message.content
        return str(content) if content else ""

# Singleton client for internal use
_client: OpenRouterClient | None = None

def get_openrouter_client() -> OpenRouterClient:
    global _client
    if _client is None:
        _client = OpenRouterClient(get_settings().openrouter_api_key)
    return _client

# Functional helpers for backward compatibility/simplicity
async def chat_completion(messages: list[dict[str, Any]], model: str | None = None) -> str:
    client = get_openrouter_client()
    chosen_model = model or get_settings().default_chat_model
    return await client.chat_completion(messages, chosen_model)

async def embed(text: str) -> list[float]:
    client = get_openrouter_client()
    return await client.embed(text, get_settings().embedding_model)
