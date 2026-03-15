"""Tests for ChatService streaming — covers the primary chat path."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.chat.service import ChatService


def _make_agent(name: str = "TestAgent") -> MagicMock:
    agent = MagicMock()
    agent.id = uuid4()
    agent.name = name
    agent.personality = "Friendly and helpful"
    agent.system_prompt = "You are a friendly assistant."
    agent.description = "A test agent"
    agent.agent_integrations = []
    return agent


def _make_memory_repo() -> MagicMock:
    repo = MagicMock()
    repo.match_memories = AsyncMock(return_value=[])
    repo.insert_memory = AsyncMock(return_value=MagicMock(id=uuid4()))
    return repo


@pytest.mark.asyncio
async def test_stream_responses_yields_content_and_done() -> None:
    """stream_responses must yield content then [[STATUS:done]]."""
    user_id = uuid4()
    agent = _make_agent()

    agent_repo = MagicMock()
    agent_repo.list_by_user = AsyncMock(return_value=[agent])

    chat_repo = MagicMock()
    memory_repo = _make_memory_repo()

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Hello from the agent!"

    service = ChatService(chat_repo, agent_repo, memory_repo)

    with patch(
        "app.domain.chat.service.get_openrouter_client"
    ) as mock_get_client:
        mock_client = MagicMock()
        mock_client.openai_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_get_client.return_value = mock_client

        with patch("app.domain.memory.service.embed", AsyncMock(return_value=[0.0] * 1536)):
            chunks = []
            async for chunk in service.stream_responses("Hello", user_id):
                chunks.append(chunk)

    assert len(chunks) >= 2
    assert chunks[-1] == "[[STATUS:done]]\n"
    assert "Hello from the agent!" in chunks


@pytest.mark.asyncio
async def test_stream_responses_no_agents_yields_error() -> None:
    """stream_responses must yield a helpful error when no agents exist."""
    user_id = uuid4()

    agent_repo = MagicMock()
    agent_repo.list_by_user = AsyncMock(return_value=[])

    service = ChatService(MagicMock(), agent_repo, MagicMock())
    chunks = []
    async for chunk in service.stream_responses("Hello", user_id):
        chunks.append(chunk)

    assert len(chunks) == 1
    assert "No agents" in chunks[0]


@pytest.mark.asyncio
async def test_stream_responses_injects_memory_context() -> None:
    """Memory context must be injected into the system prompt when memories exist."""
    user_id = uuid4()
    agent = _make_agent()

    agent_repo = MagicMock()
    agent_repo.list_by_user = AsyncMock(return_value=[agent])

    memory = MagicMock()
    memory.content = "User loves Python"
    memory_repo = MagicMock()
    memory_repo.match_memories = AsyncMock(return_value=[memory])
    memory_repo.insert_memory = AsyncMock(return_value=MagicMock(id=uuid4()))

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Great, I remember that!"

    service = ChatService(MagicMock(), agent_repo, memory_repo)

    captured_messages = []

    async def capture_create(**kwargs):
        captured_messages.extend(kwargs.get("messages", []))
        return mock_response

    with patch("app.domain.chat.service.get_openrouter_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.openai_client.chat.completions.create = capture_create
        mock_get_client.return_value = mock_client

        with patch("app.domain.memory.service.embed", AsyncMock(return_value=[0.0] * 1536)):
            async for _ in service.stream_responses("What do I love?", user_id):
                pass

    system_msg = next((m for m in captured_messages if m["role"] == "system"), None)
    assert system_msg is not None
    assert "User loves Python" in system_msg["content"]
    assert "MEMORY CONTEXT" in system_msg["content"]
