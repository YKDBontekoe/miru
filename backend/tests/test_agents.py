import json
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.agents import (
    AgentCreate,
    RoomCreate,
    add_agent_to_room,
    create_agent,
    create_room,
    generate_agent,
    get_agents,
    get_room_agents,
    get_room_messages,
    get_rooms,
    save_message,
    stream_room_responses,
)


@pytest.fixture
def mock_supabase() -> MagicMock:
    return MagicMock()


@pytest.mark.asyncio
async def test_create_agent(mock_supabase: MagicMock) -> None:
    user_id = uuid4()
    agent_data = AgentCreate(name="Test Agent", personality="Friendly")

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {
            "id": "agent-123",
            "name": "Test Agent",
            "personality": "Friendly",
            "created_at": "2023-01-01T00:00:00Z",
        }
    ]
    mock_supabase.table().insert.return_value = mock_execute

    result = await create_agent(agent_data, user_id, supabase=mock_supabase)
    assert result.name == "Test Agent"
    assert result.personality == "Friendly"
    insert_args = mock_supabase.table().insert.call_args.args[0]
    assert insert_args["user_id"] == str(user_id)
    assert insert_args["name"] == "Test Agent"
    assert insert_args["personality"] == "Friendly"
    assert insert_args["goals"] == []
    assert insert_args["capabilities"] == []
    assert insert_args["integrations"] == []
    assert "system_prompt" in insert_args


@patch("app.agents.chat_completion", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_generate_agent(mock_chat_completion: AsyncMock) -> None:
    mock_chat_completion.return_value = json.dumps(
        {
            "name": "Orbit",
            "personality": "You are a strategic planning assistant.",
            "description": "Helps users map goals into execution plans",
            "goals": ["Clarify priorities", "Build weekly action plans"],
            "capabilities": ["task_planning", "summarization"],
            "suggested_integrations": ["discord", "spotify"],
        }
    )

    result = await generate_agent("planner")
    assert result.name == "Orbit"
    assert result.description == "Helps users map goals into execution plans"
    assert "task_planning" in result.capabilities
    assert "discord" in result.suggested_integrations


@pytest.mark.asyncio
async def test_get_agents(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {
            "id": "agent-123",
            "name": "Test Agent",
            "personality": "Friendly",
            "created_at": "2023-01-01T00:00:00Z",
        }
    ]
    mock_supabase.table().select().eq.return_value = mock_execute

    results = await get_agents(user_id, supabase=mock_supabase)
    assert len(results) == 1
    assert results[0].name == "Test Agent"


@pytest.mark.asyncio
async def test_create_room(mock_supabase: MagicMock) -> None:
    user_id = uuid4()
    room_data = RoomCreate(name="Test Room")

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {"id": "room-123", "name": "Test Room", "created_at": "2023-01-01T00:00:00Z"}
    ]
    mock_supabase.table().insert.return_value = mock_execute

    result = await create_room(room_data, user_id, supabase=mock_supabase)
    assert result.name == "Test Room"


@pytest.mark.asyncio
async def test_get_rooms(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {"id": "room-123", "name": "Test Room", "created_at": "2023-01-01T00:00:00Z"}
    ]
    mock_supabase.table().select().eq.return_value = mock_execute

    results = await get_rooms(user_id, supabase=mock_supabase)
    assert len(results) == 1
    assert results[0].name == "Test Room"


@pytest.mark.asyncio
async def test_add_agent_to_room(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_supabase.table().insert.return_value = mock_execute

    result = await add_agent_to_room("room-123", "agent-123", user_id, supabase=mock_supabase)
    assert result == {"status": "added"}
    mock_supabase.table().insert.assert_called_with(
        {"room_id": "room-123", "agent_id": "agent-123"}
    )


@pytest.mark.asyncio
async def test_get_room_agents(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {
            "agents": {
                "id": "agent-123",
                "name": "Test Agent",
                "personality": "Friendly",
                "created_at": "2023-01-01T00:00:00Z",
            }
        }
    ]
    mock_supabase.table().select().eq.return_value = mock_execute

    results = await get_room_agents("room-123", user_id, supabase=mock_supabase)
    assert len(results) == 1
    assert results[0].name == "Test Agent"


@pytest.mark.asyncio
async def test_get_room_messages(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {
            "id": "msg-1",
            "room_id": "room-123",
            "user_id": str(user_id),
            "agent_id": None,
            "content": "Hello",
            "created_at": "2023-01-01T00:00:00Z",
        }
    ]
    mock_supabase.table().select().eq().order.return_value = mock_execute

    results = await get_room_messages("room-123", user_id, supabase=mock_supabase)
    assert len(results) == 1
    assert results[0].content == "Hello"


@pytest.mark.asyncio
async def test_save_message_user(mock_supabase: MagicMock) -> None:
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {
            "id": "msg-1",
            "room_id": "room-123",
            "user_id": "user-123",
            "agent_id": None,
            "content": "Hello",
            "created_at": "2023-01-01T00:00:00Z",
        }
    ]
    mock_supabase.table().insert.return_value = mock_execute

    result = await save_message("room-123", "Hello", "user-123", is_agent=False, supabase=mock_supabase)
    assert result.content == "Hello"
    assert result.user_id == "user-123"
    mock_supabase.table().insert.assert_called_with(
        {"room_id": "room-123", "content": "Hello", "user_id": "user-123"}
    )


@pytest.mark.asyncio
async def test_save_message_agent(mock_supabase: MagicMock) -> None:
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {
            "id": "msg-1",
            "room_id": "room-123",
            "user_id": None,
            "agent_id": "agent-123",
            "content": "Hello",
            "created_at": "2023-01-01T00:00:00Z",
        }
    ]
    mock_supabase.table().insert.return_value = mock_execute

    result = await save_message("room-123", "Hello", "agent-123", is_agent=True, supabase=mock_supabase)
    assert result.content == "Hello"
    assert result.agent_id == "agent-123"
    mock_supabase.table().insert.assert_called_with(
        {"room_id": "room-123", "content": "Hello", "agent_id": "agent-123"}
    )


@patch("app.agents.update_agent_mood", new_callable=AsyncMock)
@patch("app.agents.get_agent_relationships", new_callable=AsyncMock)
@patch("app.agents.chat_completion")
@pytest.mark.asyncio
@patch("app.agents.save_message")
@patch("app.agents.get_room_messages")
@patch("app.agents.get_agents")
@patch("app.agents.get_room_agents")
@patch("app.agents.retrieve_memories")
@patch("app.agents.stream_chat")
@patch("app.agents.embed", new_callable=AsyncMock)
async def test_stream_room_responses(
    mock_embed: AsyncMock,
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock,
    mock_chat_completion: MagicMock,
    mock_get_agent_relationships: AsyncMock,
    mock_update_agent_mood: AsyncMock,
    mock_supabase: MagicMock,
) -> None:
    mock_embed.return_value = [0.1, 0.2]
    mock_get_agent_relationships.return_value = ""
    user_id = uuid4()

    # Mock retrieve memories
    mock_retrieve_memories.return_value = ["User likes blue"]

    # Mock agents and messages
    mock_agent = MagicMock()
    mock_agent.id = "agent-123"
    mock_agent.name = "Test Agent"
    mock_agent.personality = "Friendly"
    mock_agent.capabilities = []
    mock_agent2 = MagicMock()
    mock_agent2.id = "agent-456"
    mock_agent2.name = "Test Agent 2"
    mock_agent2.personality = "Quiet"
    mock_agent2.capabilities = []
    mock_get_room_agents.return_value = [mock_agent, mock_agent2]

    mock_msg = MagicMock()
    mock_msg.user_id = str(user_id)
    mock_msg.agent_id = None
    mock_msg.content = "Hi there"
    mock_get_room_messages.return_value = [mock_msg]
    mock_get_agents.return_value = [mock_agent, mock_agent2]

    # Mock orchestrator behavior: agent-123 speaks, then stop
    mock_chat_completion.side_effect = ['["agent-123"]', "[]"]

    # Mock stream chat to yield strings
    async def mock_stream(*args: Any, **kwargs: Any) -> AsyncGenerator[str]:
        yield "Hello"
        yield " World"

    mock_stream_chat.side_effect = mock_stream

    # Test streaming
    chunks = []
    async for chunk in stream_room_responses("room-123", "How are you?", user_id, supabase=mock_supabase):
        chunks.append(chunk)

    # Filter out status events to check only the content-bearing chunks.
    content_chunks = [c for c in chunks if not c.startswith("[[STATUS:")]
    assert content_chunks == [
        "[[AGENT:agent-123:Test Agent]]\n",
        "Hello",
        " World",
        "\n\n",
    ]
    # Verify that status events were indeed emitted.
    status_chunks = [c for c in chunks if c.startswith("[[STATUS:")]
    assert "[[STATUS:retrieving_memories]]\n" in status_chunks
    assert any(c.startswith("[[STATUS:glance:") for c in status_chunks)
    assert any(c.startswith("[[STATUS:loading_agent:") for c in status_chunks)
    assert "[[STATUS:done]]\n" in status_chunks

    assert mock_save_message.call_count == 2  # 1 for user, 1 for agent


@pytest.mark.asyncio
async def test_get_room_agents_no_agents(mock_supabase: MagicMock) -> None:
    user_id = uuid4()

    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [{"agents": None}]
    mock_supabase.table().select().eq.return_value = mock_execute

    results = await get_room_agents("room-123", user_id, supabase=mock_supabase)
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
    mock_supabase: MagicMock,
) -> None:
    user_id = uuid4()
    mock_get_room_agents.return_value = []
    mock_get_room_messages.return_value = []

    chunks = []
    async for chunk in stream_room_responses("room-123", "How are you?", user_id, supabase=mock_supabase):
        chunks.append(chunk)

    assert chunks == ["No agents in this room to respond."]


@patch("app.agents.update_agent_mood", new_callable=AsyncMock)
@patch("app.agents.get_agent_relationships", new_callable=AsyncMock)
@patch("app.agents.chat_completion")
@pytest.mark.asyncio
@patch("app.agents.save_message")
@patch("app.agents.get_room_messages")
@patch("app.agents.get_agents")
@patch("app.agents.get_room_agents")
@patch("app.agents.retrieve_memories")
@patch("app.agents.stream_chat")
@patch("app.agents.embed", new_callable=AsyncMock)
async def test_stream_room_responses_no_history(
    mock_embed: AsyncMock,
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock,
    mock_chat_completion: MagicMock,
    mock_get_agent_relationships: AsyncMock,
    mock_update_agent_mood: AsyncMock,
    mock_supabase: MagicMock,
) -> None:
    mock_embed.return_value = [0.1, 0.2]
    mock_get_agent_relationships.return_value = ""
    user_id = uuid4()
    mock_retrieve_memories.return_value = []

    mock_agent = MagicMock()
    mock_agent.id = "agent-123"
    mock_agent.name = "Test Agent"
    mock_agent.personality = "Friendly"
    mock_agent.capabilities = []
    mock_agent2 = MagicMock()
    mock_agent2.id = "agent-456"
    mock_agent2.name = "Test Agent 2"
    mock_agent2.personality = "Quiet"
    mock_agent2.capabilities = []
    mock_get_room_agents.return_value = [mock_agent, mock_agent2]

    mock_get_room_messages.return_value = []
    mock_get_agents.return_value = [mock_agent, mock_agent2]

    # Mock orchestrator behavior: agent-123 speaks, then stop
    mock_chat_completion.side_effect = ['["agent-123"]', "[]"]

    async def mock_stream(*args: Any, **kwargs: Any) -> AsyncGenerator[str]:
        yield "Hello"

    mock_stream_chat.side_effect = mock_stream

    chunks = []
    async for chunk in stream_room_responses("room-123", "How are you?", user_id, supabase=mock_supabase):
        chunks.append(chunk)

    content_chunks = [c for c in chunks if not c.startswith("[[STATUS:")]
    assert content_chunks == ["[[AGENT:agent-123:Test Agent]]\n", "Hello", "\n\n"]
    status_chunks = [c for c in chunks if c.startswith("[[STATUS:")]
    assert "[[STATUS:retrieving_memories]]\n" in status_chunks
    assert any(c.startswith("[[STATUS:glance:") for c in status_chunks)
    assert "[[STATUS:done]]\n" in status_chunks


@patch("app.agents.update_agent_mood", new_callable=AsyncMock)
@patch("app.agents.get_agent_relationships", new_callable=AsyncMock)
@patch("app.agents.chat_completion")
@pytest.mark.asyncio
@patch("app.agents.save_message")
@patch("app.agents.get_room_messages")
@patch("app.agents.get_agents")
@patch("app.agents.get_room_agents")
@patch("app.agents.retrieve_memories")
@patch("app.agents.stream_chat")
@patch("app.agents.embed", new_callable=AsyncMock)
async def test_stream_room_responses_with_agent_history(
    mock_embed: AsyncMock,
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock,
    mock_chat_completion: MagicMock,
    mock_get_agent_relationships: AsyncMock,
    mock_update_agent_mood: AsyncMock,
    mock_supabase: MagicMock,
) -> None:
    mock_embed.return_value = [0.1, 0.2]
    mock_get_agent_relationships.return_value = ""
    user_id = uuid4()
    mock_retrieve_memories.return_value = []

    mock_agent = MagicMock()
    mock_agent.id = "agent-123"
    mock_agent.name = "Test Agent"
    mock_agent.personality = "Friendly"
    mock_agent.capabilities = []
    mock_agent2 = MagicMock()
    mock_agent2.id = "agent-456"
    mock_agent2.name = "Test Agent 2"
    mock_agent2.personality = "Quiet"
    mock_agent2.capabilities = []
    mock_get_room_agents.return_value = [mock_agent, mock_agent2]

    mock_msg = MagicMock()
    mock_msg.user_id = None
    mock_msg.agent_id = "agent-123"
    mock_msg.content = "Hi there"
    mock_get_room_messages.return_value = [mock_msg]
    mock_get_agents.return_value = [mock_agent, mock_agent2]

    # Mock orchestrator behavior: agent-123 speaks, then stop
    mock_chat_completion.side_effect = ['["agent-123"]', "[]"]

    async def mock_stream(*args: Any, **kwargs: Any) -> AsyncGenerator[str]:
        yield "Hello"

    mock_stream_chat.side_effect = mock_stream

    # Test streaming
    chunks = []
    async for chunk in stream_room_responses(
        "room-123", "How are you?", user_id, supabase=mock_supabase
    ):
        chunks.append(chunk)

    content_chunks = [c for c in chunks if not c.startswith("[[STATUS:")]
    assert content_chunks == ["[[AGENT:agent-123:Test Agent]]\n", "Hello", "\n\n"]
    status_chunks = [c for c in chunks if c.startswith("[[STATUS:")]
    assert "[[STATUS:retrieving_memories]]\n" in status_chunks
    assert any(c.startswith("[[STATUS:glance:") for c in status_chunks)
    assert "[[STATUS:done]]\n" in status_chunks
