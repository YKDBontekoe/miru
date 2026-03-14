"""Tests for ChatService logic."""

import typing
from unittest.mock import AsyncMock, MagicMock

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
    agent1.agent_integrations = []

    tools = chat_service._get_agent_tools(agent1)
    assert len(tools) == 0

    # Agent with a steam integration
    steam_id = "12345678901234567"
    agent2 = MagicMock()

    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {"steam_id": steam_id}

    agent2.agent_integrations = [mock_ai]

    tools = chat_service._get_agent_tools(agent2)
    assert len(tools) == 2
    assert tools[0].name == "steam_player_summary"
    assert tools[1].name == "steam_owned_games"


@pytest.mark.asyncio
async def test_get_agent_tools_disabled_integration(chat_service: typing.Any) -> None:
    """Disabled integrations are skipped."""
    agent = MagicMock()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = False
    mock_ai.config = {"steam_id": "12345678901234567"}
    agent.agent_integrations = [mock_ai]

    tools = chat_service._get_agent_tools(agent)
    assert len(tools) == 0


@pytest.mark.asyncio
async def test_get_agent_tools_steam_missing_id(chat_service: typing.Any) -> None:
    """Steam integration without steam_id produces no tools."""
    agent = MagicMock()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {}
    agent.agent_integrations = [mock_ai]

    tools = chat_service._get_agent_tools(agent)
    assert len(tools) == 0


@pytest.mark.asyncio
async def test_run_crew_task_has_single_agent(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    import uuid
    from unittest.mock import patch

    user_id = uuid.uuid4()

    agent = MagicMock()
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
