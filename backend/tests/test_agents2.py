from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.agents import (
    get_room_agents,
    stream_room_responses,
)


@pytest.fixture
def mock_supabase() -> Any:
    with patch("app.agents.get_supabase") as mock_get_supabase:
        mock_client = MagicMock()
        mock_get_supabase.return_value = mock_client
        yield mock_client


@pytest.mark.asyncio
async def test_get_room_agents_no_agents(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [{"agents": None}]
    mock_supabase.table().select().eq.return_value = mock_execute

    results = await get_room_agents("room-123", user_id)
    assert len(results) == 0


@pytest.mark.asyncio
@patch("app.agents.save_message")
@patch("app.agents.get_room_messages")
@patch("app.agents.get_agents")
@patch("app.agents.get_room_agents")
@patch("app.agents.retrieve_memories")
@patch("app.agents.stream_chat")
async def test_stream_room_responses_no_agents(
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock,
) -> None:
    user_id = uuid4()
    mock_get_room_agents.return_value = []
    mock_get_room_messages.return_value = []

    chunks = []
    async for chunk in stream_room_responses("room-123", "How are you?", user_id):
        chunks.append(chunk)

    assert chunks == ["No agents in this room to respond."]


@pytest.mark.asyncio
@patch("app.agents.save_message")
@patch("app.agents.get_room_messages")
@patch("app.agents.get_agents")
@patch("app.agents.get_room_agents")
@patch("app.agents.retrieve_memories")
@patch("app.agents.stream_chat")
async def test_stream_room_responses_no_history(
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock,
) -> None:
    user_id = uuid4()
    mock_retrieve_memories.return_value = []

    mock_agent = MagicMock()
    mock_agent.id = "agent-123"
    mock_agent.name = "Test Agent"
    mock_agent.personality = "Friendly"
    mock_get_room_agents.return_value = [mock_agent]

    mock_get_room_messages.return_value = []
    mock_get_agents.return_value = []

    async def mock_stream(*args: Any, **kwargs: Any) -> AsyncGenerator[str, None]:
        yield "Hello"

    mock_stream_chat.side_effect = mock_stream

    chunks = []
    async for chunk in stream_room_responses("room-123", "How are you?", user_id):
        chunks.append(chunk)

    assert chunks == ["[[AGENT:agent-123:Test Agent]]\n", "Hello", "\n\n"]
