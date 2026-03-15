"""Tests for ChatService logic."""

from __future__ import annotations

import typing
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.domain.chat.service import ChatService


@pytest.fixture
def chat_service() -> ChatService:
    chat_repo = AsyncMock()
    agent_repo = AsyncMock()
    memory_repo = AsyncMock()
    return ChatService(chat_repo, agent_repo, memory_repo)


def test_get_agent_tools(chat_service: typing.Any) -> None:
    """_get_agent_tools is synchronous and reads from prefetched agent_integrations."""
    # Agent with no integrations
    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.agent_integrations = []

    user_id = uuid4()
    tools = chat_service._get_agent_tools(agent1, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types

    # Agent with a steam integration
    steam_id = "12345678901234567"
    agent2 = MagicMock()
    agent2.id = uuid4()

    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {"steam_id": steam_id}

    agent2.agent_integrations = [mock_ai]

    tools = chat_service._get_agent_tools(agent2, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types
    assert "SteamOwnedGamesTool" in tool_types
    assert "SteamPlayerSummaryTool" in tool_types
    assert tools[0].name == "steam_player_summary"
    assert tools[1].name == "steam_owned_games"


def test_get_agent_tools_disabled_integration(chat_service: typing.Any) -> None:
    """Disabled integrations are skipped."""
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = False
    mock_ai.config = {"steam_id": "12345678901234567"}
    agent.agent_integrations = [mock_ai]

    user_id = uuid4()
    tools = chat_service._get_agent_tools(agent, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types


def test_get_agent_tools_steam_missing_id(chat_service: typing.Any) -> None:
    """Steam integration without steam_id produces no tools."""
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {}
    agent.agent_integrations = [mock_ai]

    user_id = uuid4()
    tools = chat_service._get_agent_tools(agent, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types


@pytest.mark.asyncio
async def test_run_crew_task_has_single_agent(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    from unittest.mock import patch

    user_id = uuid4()

    agent = MagicMock()
    agent.id = uuid4()
    agent.name = "Test Agent"
    agent.personality = "Helpful"
    agent.description = "A helpful agent"
    agent.agent_integrations = []

    chat_service.agent_repo.list_by_user.return_value = [agent]

    # Mock _get_crew_llm to prevent it looking for OPENAI_API_KEY
    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(chat_service, "_get_crew_llm", MagicMock(return_value=mock_llm))

    with (
        patch("app.domain.chat.service.Task") as mock_task_cls,
        patch("app.domain.chat.service.Crew") as mock_crew_cls,
        patch("app.domain.chat.service.crewai.Agent") as mock_agent_cls,
    ):
        mock_crew_agent = MagicMock()
        mock_crew_agent.role = "Test Agent"
        mock_agent_cls.return_value = mock_crew_agent

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
        mock_crew_cls.return_value = mock_crew_instance

        result = await chat_service.run_crew("hello", user_id)

        assert result["task_type"] == "general"
        assert result["result"] == "Crew output"

        # Verify Task was instantiated with single agent
        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        assert "agent" in kwargs
        assert kwargs["agent"] == mock_crew_agent

        # Verify Crew was instantiated with agents list
        mock_crew_cls.assert_called_once()
        _, crew_kwargs = mock_crew_cls.call_args
        assert "agents" in crew_kwargs
        assert crew_kwargs["agents"] == [mock_crew_agent]


@pytest.mark.asyncio
async def test_run_crew_task_has_multiple_agents(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    from unittest.mock import patch

    user_id = uuid4()

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent 1"
    agent1.personality = "Helpful"
    agent1.description = "A helpful agent"
    agent1.agent_integrations = []

    agent2 = MagicMock()
    agent2.id = uuid4()
    agent2.name = "Agent 2"
    agent2.personality = "Funny"
    agent2.description = "A funny agent"
    agent2.agent_integrations = []

    chat_service.agent_repo.list_by_user.return_value = [agent1, agent2]

    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(chat_service, "_get_crew_llm", MagicMock(return_value=mock_llm))

    with (
        patch("app.domain.chat.service.Task") as mock_task_cls,
        patch("app.domain.chat.service.Crew") as mock_crew_cls,
        patch("app.domain.chat.service.crewai.Agent") as mock_agent_cls,
        patch("app.domain.chat.service.Process") as mock_process,
    ):
        mock_crew_agent1 = MagicMock()
        mock_crew_agent1.role = "Agent 1"
        mock_crew_agent2 = MagicMock()
        mock_crew_agent2.role = "Agent 2"
        mock_agent_cls.side_effect = [mock_crew_agent1, mock_crew_agent2]

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
        mock_crew_cls.return_value = mock_crew_instance

        result = await chat_service.run_crew("hello", user_id)

        assert result["task_type"] == "general"
        assert result["result"] == "Crew output"

        # Verify Task was instantiated without an assigned agent (hierarchical)
        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        assert "agent" not in kwargs

        # Verify Crew was instantiated hierarchically with manager_llm
        mock_crew_cls.assert_called_once()
        _, crew_kwargs = mock_crew_cls.call_args
        assert "agents" in crew_kwargs
        assert crew_kwargs["agents"] == [mock_crew_agent1, mock_crew_agent2]
        assert "manager_llm" in crew_kwargs
        assert crew_kwargs["manager_llm"] == mock_llm
        assert crew_kwargs["process"] == mock_process.hierarchical


@pytest.mark.asyncio
async def test_stream_room_responses_single_agent(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    from unittest.mock import patch

    user_id = uuid4()
    room_id = uuid4()

    agent = MagicMock()
    agent.id = uuid4()
    agent.name = "Test Agent"
    agent.personality = "Helpful"
    agent.description = "A helpful agent"
    agent.agent_integrations = []

    chat_service.chat_repo.list_room_agents.return_value = [agent]

    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(chat_service, "_get_crew_llm", MagicMock(return_value=mock_llm))

    with (
        patch("app.domain.chat.service.Task") as mock_task_cls,
        patch("app.domain.chat.service.Crew") as mock_crew_cls,
        patch("app.domain.chat.service.crewai.Agent") as mock_agent_cls,
        patch("app.domain.chat.service.Process") as mock_process,
    ):
        mock_crew_agent = MagicMock()
        mock_crew_agent.role = "Test Agent"
        mock_agent_cls.return_value = mock_crew_agent

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
        mock_crew_cls.return_value = mock_crew_instance

        responses = []
        async for r in chat_service.stream_room_responses(room_id, "hello", user_id):
            responses.append(r)

        assert responses == ["Crew output", "[[STATUS:done]]\n"]

        # Verify Task was instantiated with single agent
        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        assert "agent" in kwargs
        assert kwargs["agent"] == mock_crew_agent

        # Verify Crew was instantiated with agents list
        mock_crew_cls.assert_called_once()
        _, crew_kwargs = mock_crew_cls.call_args
        assert "agents" in crew_kwargs
        assert crew_kwargs["agents"] == [mock_crew_agent]
        assert crew_kwargs["process"] == mock_process.sequential


@pytest.mark.asyncio
async def test_stream_room_responses_multiple_agents(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    from unittest.mock import patch

    user_id = uuid4()
    room_id = uuid4()

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Test Agent 1"
    agent1.personality = "Helpful"
    agent1.description = "A helpful agent"
    agent1.agent_integrations = []

    agent2 = MagicMock()
    agent2.id = uuid4()
    agent2.name = "Test Agent 2"
    agent2.personality = "Funny"
    agent2.description = "A funny agent"
    agent2.agent_integrations = []

    chat_service.chat_repo.list_room_agents.return_value = [agent1, agent2]

    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(chat_service, "_get_crew_llm", MagicMock(return_value=mock_llm))

    with (
        patch("app.domain.chat.service.Task") as mock_task_cls,
        patch("app.domain.chat.service.Crew") as mock_crew_cls,
        patch("app.domain.chat.service.crewai.Agent") as mock_agent_cls,
        patch("app.domain.chat.service.Process") as mock_process,
    ):
        mock_crew_agent1 = MagicMock()
        mock_crew_agent1.role = "Test Agent 1"
        mock_crew_agent2 = MagicMock()
        mock_crew_agent2.role = "Test Agent 2"
        mock_agent_cls.side_effect = [mock_crew_agent1, mock_crew_agent2]

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
        mock_crew_cls.return_value = mock_crew_instance

        responses = []
        async for r in chat_service.stream_room_responses(room_id, "hello", user_id):
            responses.append(r)

        assert responses == ["Crew output", "[[STATUS:done]]\n"]

        # Verify Task was instantiated without single agent
        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        assert "agent" not in kwargs

        # Verify Crew was instantiated with multiple agents
        mock_crew_cls.assert_called_once()
        _, crew_kwargs = mock_crew_cls.call_args
        assert "agents" in crew_kwargs
        assert crew_kwargs["agents"] == [mock_crew_agent1, mock_crew_agent2]
        assert crew_kwargs["process"] == mock_process.hierarchical
        assert "manager_llm" in crew_kwargs
        assert crew_kwargs["manager_llm"] == mock_llm


@pytest.mark.asyncio
async def test_stream_room_responses_no_agents(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    user_id = uuid4()
    room_id = uuid4()

    chat_service.chat_repo.list_room_agents.return_value = []

    responses = []
    async for r in chat_service.stream_room_responses(room_id, "hello", user_id):
        responses.append(r)

    assert responses == ["No agents in this room. Please add some first."]
