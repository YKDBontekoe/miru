from __future__ import annotations

import asyncio
from typing import Any, cast
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import BaseModel

from app.infrastructure.external.openrouter import (
    OpenRouterClient,
    chat_completion,
    embed,
    get_openrouter_client,
    structured_completion,
)


def test_get_openrouter_client() -> None:
    from app.infrastructure.external import openrouter

    openrouter._client = None
    with (
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
        patch("app.infrastructure.external.openrouter.OpenRouterClient") as mock_client_class,
        patch("app.infrastructure.external.openrouter._client", None),
    ):
        mock_settings.return_value = MagicMock(openrouter_api_key="test-key")
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Test getting the client
        client = get_openrouter_client()
        assert client == mock_client
        mock_client_class.assert_called_once_with("test-key")
    openrouter._client = None


def test_openrouter_client_init() -> None:
    """Test that the OpenRouterClient initializes instructor with OPENROUTER_STRUCTURED_OUTPUTS mode."""
    with (
        patch("openai.AsyncOpenAI") as mock_openai,
        patch("instructor.from_openai") as mock_from_openai,
    ):
        import instructor

        mock_openai_instance = MagicMock()
        mock_openai.return_value = mock_openai_instance

        mock_instructor_instance = MagicMock()
        mock_from_openai.return_value = mock_instructor_instance

        client = OpenRouterClient("test-key")

        mock_openai.assert_called_once()
        assert mock_openai.call_args[1]["api_key"] == "test-key"

        # Verify instructor is initialized with OPENROUTER_STRUCTURED_OUTPUTS mode
        mock_from_openai.assert_called_once_with(
            mock_openai_instance,
            mode=instructor.Mode.OPENROUTER_STRUCTURED_OUTPUTS,
        )
        assert client.instructor_client == mock_instructor_instance


@pytest.mark.asyncio
async def test_embed_success() -> None:
    with (
        patch("openai.AsyncOpenAI"),
        patch("instructor.from_openai"),
    ):
        client = OpenRouterClient("test-key")

        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1, 0.2])]
        cast("Any", client.openai_client.embeddings).create = AsyncMock(return_value=mock_response)

        result = await client.embed("test text", "test-model")
        assert result == [0.1, 0.2]


@pytest.mark.asyncio
async def test_chat_completion_success() -> None:
    with (
        patch("openai.AsyncOpenAI"),
        patch("instructor.from_openai"),
    ):
        client = OpenRouterClient("test-key")

        from app.infrastructure.external.openrouter import ChatResponse

        mock_response = ChatResponse(message="hello")
        cast("Any", client.instructor_client.chat.completions).create = AsyncMock(
            return_value=mock_response
        )

        result = await client.chat_completion([{"role": "user", "content": "hi"}], "test-model")
        assert result == "hello"


class DummyModel(BaseModel):
    name: str


@pytest.mark.asyncio
async def test_structured_completion_success() -> None:
    with (
        patch("openai.AsyncOpenAI"),
        patch("instructor.from_openai"),
    ):
        client = OpenRouterClient("test-key")

        mock_response = DummyModel(name="test")
        cast("Any", client.instructor_client.chat.completions).create = AsyncMock(
            return_value=mock_response
        )

        result = await client.structured_completion(
            [{"role": "user", "content": "hi"}], "test-model", DummyModel
        )
        assert result.name == "test"


@pytest.mark.asyncio
async def test_standalone_embed() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(embedding_model="test-embed-model")
        mock_client = MagicMock()
        mock_client.embed = AsyncMock(return_value=[0.1, 0.2])
        mock_get_client.return_value = mock_client

        result = await embed("test text")
        assert result == [0.1, 0.2]
        mock_client.embed.assert_called_once_with("test text", "test-embed-model")


@pytest.mark.asyncio
async def test_standalone_chat_completion_success() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model")
        mock_client = MagicMock()
        mock_client.chat_completion = AsyncMock(return_value="hello")
        mock_get_client.return_value = mock_client

        result = await chat_completion([{"role": "user", "content": "hi"}])
        assert result == "hello"
        mock_client.chat_completion.assert_called_once_with(
            [{"role": "user", "content": "hi"}], "default-model"
        )


@pytest.mark.asyncio
async def test_standalone_chat_completion_fallback() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="default-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        # First call fails, second call succeeds
        mock_client.chat_completion = AsyncMock(
            side_effect=[Exception("First error"), "fallback-hello"]
        )
        mock_get_client.return_value = mock_client

        result = await chat_completion([{"role": "user", "content": "hi"}])
        assert result == "fallback-hello"
        assert mock_client.chat_completion.call_count == 2

        # Check that it called with fallback model
        mock_client.chat_completion.assert_called_with(
            [{"role": "user", "content": "hi"}], "fallback-model"
        )


@pytest.mark.asyncio
async def test_standalone_chat_completion_fallback_fails() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="default-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        # Both calls fail
        mock_client.chat_completion = AsyncMock(
            side_effect=[Exception("First error"), Exception("Fallback error")]
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception, match="Fallback error"):
            await chat_completion([{"role": "user", "content": "hi"}])


@pytest.mark.asyncio
async def test_standalone_chat_completion_cancelled() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="default-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        mock_client.chat_completion = AsyncMock(side_effect=asyncio.CancelledError())
        mock_get_client.return_value = mock_client

        with pytest.raises(asyncio.CancelledError):
            await chat_completion([{"role": "user", "content": "hi"}])

        assert mock_client.chat_completion.call_count == 1


@pytest.mark.asyncio
async def test_standalone_structured_completion_success() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model")
        mock_client = MagicMock()
        mock_client.structured_completion = AsyncMock(return_value=DummyModel(name="hello"))
        mock_get_client.return_value = mock_client

        result = await structured_completion([{"role": "user", "content": "hi"}], DummyModel)
        assert result.name == "hello"
        mock_client.structured_completion.assert_called_once_with(
            [{"role": "user", "content": "hi"}], "default-model", DummyModel
        )


@pytest.mark.asyncio
async def test_standalone_structured_completion_fallback() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="default-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        # First call fails, second call succeeds
        mock_client.structured_completion = AsyncMock(
            side_effect=[Exception("First error"), DummyModel(name="fallback-hello")]
        )
        mock_get_client.return_value = mock_client

        result = await structured_completion([{"role": "user", "content": "hi"}], DummyModel)
        assert result.name == "fallback-hello"
        assert mock_client.structured_completion.call_count == 2

        # Check that it called with fallback model
        mock_client.structured_completion.assert_called_with(
            [{"role": "user", "content": "hi"}], "fallback-model", DummyModel
        )


@pytest.mark.asyncio
async def test_standalone_structured_completion_fallback_fails() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="default-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        # Both calls fail
        mock_client.structured_completion = AsyncMock(
            side_effect=[Exception("First error"), Exception("Fallback error")]
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception, match="Fallback error"):
            await structured_completion([{"role": "user", "content": "hi"}], DummyModel)


@pytest.mark.asyncio
async def test_standalone_structured_completion_cancelled() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="default-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        mock_client.structured_completion = AsyncMock(side_effect=asyncio.CancelledError())
        mock_get_client.return_value = mock_client

        with pytest.raises(asyncio.CancelledError):
            await structured_completion([{"role": "user", "content": "hi"}], DummyModel)

        assert mock_client.structured_completion.call_count == 1


@pytest.mark.asyncio
async def test_stream_chat_success() -> None:
    """Test successful stream_chat call as an async generator."""
    from app.infrastructure.external.openrouter import stream_chat

    messages = [{"role": "user", "content": "hello"}]

    with (
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="primary-model")
        mock_client = MagicMock()

        async def mock_primary_iterator():
            yield "chunk1"
            yield "chunk2"

        mock_client.stream_chat = AsyncMock(return_value=mock_primary_iterator())
        mock_get_client.return_value = mock_client

        chunks = []
        async for chunk in stream_chat(messages):  # type: ignore
            chunks.append(chunk)

        assert chunks == ["chunk1", "chunk2"]
        mock_client.stream_chat.assert_called_once_with(messages, "primary-model")


@pytest.mark.asyncio
async def test_stream_chat_fallback() -> None:
    """Test stream_chat falling back to a secondary model during iteration."""
    from app.infrastructure.external.openrouter import stream_chat

    messages = [{"role": "user", "content": "hello"}]

    with (
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="primary-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        async def mock_primary_iterator():
            yield "primary1"
            raise Exception("Primary model failed during iteration")

        async def mock_fallback_iterator():
            yield "fallback1"
            yield "fallback2"

        # The stream_chat function is called, but we configure it to return generators
        mock_client.stream_chat = AsyncMock(
            side_effect=[mock_primary_iterator(), mock_fallback_iterator()]
        )
        mock_get_client.return_value = mock_client

        chunks = []
        async for chunk in stream_chat(messages):  # type: ignore
            chunks.append(chunk)

        # It yields 'primary1', then catches the exception, creates fallback iterator, and yields 'fallback1', 'fallback2'
        assert chunks == ["primary1", "fallback1", "fallback2"]
        assert mock_client.stream_chat.call_count == 2
        mock_client.stream_chat.assert_any_call(messages, "primary-model")
        mock_client.stream_chat.assert_any_call(messages, "fallback-model")


@pytest.mark.asyncio
async def test_stream_chat_fallback_fails() -> None:
    """Test stream_chat failing entirely when both models fail."""
    from app.infrastructure.external.openrouter import stream_chat

    messages = [{"role": "user", "content": "hello"}]

    with (
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="primary-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        async def mock_primary_iterator():
            raise Exception("Primary model failed")
            yield "never"

        async def mock_fallback_iterator():
            raise Exception("Fallback model failed")
            yield "never"

        mock_client.stream_chat = AsyncMock(
            side_effect=[mock_primary_iterator(), mock_fallback_iterator()]
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception, match="Fallback model failed"):
            async for _chunk in stream_chat(messages):  # type: ignore
                pass


@pytest.mark.asyncio
async def test_stream_chat_cancelled() -> None:
    """Test stream_chat handling CancelledError."""
    from app.infrastructure.external.openrouter import stream_chat

    messages = [{"role": "user", "content": "hello"}]

    with (
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
    ):
        mock_settings.return_value = MagicMock(
            default_chat_model="primary-model", fallback_chat_model="fallback-model"
        )
        mock_client = MagicMock()

        async def mock_primary_iterator():
            raise asyncio.CancelledError()
            yield "never"

        mock_client.stream_chat = AsyncMock(side_effect=[mock_primary_iterator()])
        mock_get_client.return_value = mock_client

        with pytest.raises(asyncio.CancelledError):
            async for _chunk in stream_chat(messages):  # type: ignore
                pass

        assert mock_client.stream_chat.call_count == 1
