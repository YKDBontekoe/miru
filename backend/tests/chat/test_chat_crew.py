from __future__ import annotations

import typing
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.chat.crew_orchestrator import CrewOrchestrator
from app.domain.chat.service import ChatService


def test_get_agent_tools() -> None:
    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.agent_integrations = []
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent1, user_id)
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types


def test_get_agent_tools_disabled_integration() -> None:
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = False
    mock_ai.config = {"steam_id": "12345678901234567"}
    agent.agent_integrations = [mock_ai]
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types


def test_get_agent_tools_steam_missing_id() -> None:
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {}
    agent.agent_integrations = [mock_ai]
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types


@pytest.mark.asyncio
async def test_run_crew_task_has_single_agent(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    user_id = uuid4()
    agent = MagicMock()
    agent.id = uuid4()
    agent.name = "Test Agent"
    agent.personality = "Helpful"
    agent.description = "A helpful agent"
    agent.agent_integrations = []
    chat_service.agent_repo.list_by_user.return_value = [agent]
    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent") as mock_agent_cls,
    ):
        mock_crew_agent = MagicMock()
        mock_crew_agent.role = "Test Agent"
        mock_agent_cls.return_value = mock_crew_agent
        mock_crew_instance = MagicMock()
        mock_result = MagicMock()
        mock_result.pydantic.segments = [MagicMock(message="Crew output")]
        mock_crew_instance.kickoff_async = AsyncMock(return_value=mock_result)
        mock_crew_cls.return_value = mock_crew_instance
        result = await chat_service.run_crew("hello", user_id, accept_language="es-ES")
        assert result["task_type"] == "general"


@pytest.mark.asyncio
async def test_run_crew_task_has_multiple_agents(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:
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
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent") as mock_agent_cls,
        patch("app.domain.chat.crew_orchestrator.Process"),
    ):
        mock_crew_agent1 = MagicMock()
        mock_crew_agent1.role = "Agent 1"
        mock_crew_agent2 = MagicMock()
        mock_crew_agent2.role = "Agent 2"
        mock_agent_cls.side_effect = [mock_crew_agent1, mock_crew_agent2]
        mock_crew_instance = MagicMock()
        mock_result = MagicMock()
        mock_result.pydantic.segments = [MagicMock(message="Crew output")]
        mock_crew_instance.kickoff_async = AsyncMock(return_value=mock_result)
        mock_crew_cls.return_value = mock_crew_instance
        result = await chat_service.run_crew("hello", user_id, accept_language="es-ES")
        assert result["task_type"] == "general"


@pytest.mark.asyncio
async def test_execute_crew_task(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        )
    ]
    user_id = uuid4()
    user_msg_id = uuid4()
    mock_llm = MagicMock()
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Result")
        mock_crew_cls.return_value = mock_crew_instance
        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="ja-JP",
        )
        assert result.segments[0].message == "Result"


@pytest.mark.asyncio
async def test_execute_crew_task_multi(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        ),
        MagicMock(
            id=uuid4(), name="Agent2", personality="Bad", description="desc", agent_integrations=[]
        ),
    ]
    user_id = uuid4()
    user_msg_id = uuid4()
    mock_llm = MagicMock()
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="ResultMulti")
        mock_crew_cls.return_value = mock_crew_instance
        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="hi-IN",
        )
        assert result.segments[0].message == "ResultMulti"

@pytest.mark.asyncio
async def test_crew_orchestrator_fallback_no_pydantic() -> None:
    room_agents = [MagicMock(id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[])]
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
        patch("app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm")
    ):
        mock_crew_instance = MagicMock()
        # Mock result without pydantic attribute
        mock_result = MagicMock()
        del mock_result.pydantic
        mock_result.__str__.return_value = "Fallback text"
        mock_crew_instance.kickoff_async = AsyncMock(return_value=mock_result)
        mock_crew_cls.return_value = mock_crew_instance

        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            uuid4()
        )

        assert result.segments[0].agent_name == "Agent"
        assert result.segments[0].message == "Fallback text"

@pytest.mark.asyncio
async def test_crew_orchestrator_raises_exception() -> None:
    room_agents = [MagicMock(id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[])]
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
        patch("app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm")
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(side_effect=Exception("Test Exception"))
        mock_crew_cls.return_value = mock_crew_instance

        with pytest.raises(Exception, match="Test Exception"):
            await CrewOrchestrator.execute_crew_task(
                room_agents,
                "Hello",
                uuid4()
            )

@pytest.mark.asyncio
async def test_crew_orchestrator_cancelled_exception() -> None:
    import asyncio
    room_agents = [MagicMock(id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[])]
    with (
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
        patch("app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm")
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(side_effect=asyncio.CancelledError())
        mock_crew_cls.return_value = mock_crew_instance

        with pytest.raises(asyncio.CancelledError):
            await CrewOrchestrator.execute_crew_task(
                room_agents,
                "Hello",
                uuid4()
            )

def test_get_agent_tools_steam_valid() -> None:
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {"steam_id": "12345"}
    agent.agent_integrations = [mock_ai]
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    tool_types = [type(t).__name__ for t in tools]
    assert "SteamOwnedGamesTool" in tool_types
    assert "SteamPlayerSummaryTool" in tool_types

def test_get_agent_tools_spotify_valid() -> None:
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "spotify"
    mock_ai.enabled = True
    mock_ai.config = {"access_token": "token"}
    agent.agent_integrations = [mock_ai]
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    tool_types = [type(t).__name__ for t in tools]
    assert "SpotifyCurrentlyPlayingTool" in tool_types

def test_get_agent_tools_discord_valid() -> None:
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "discord"
    mock_ai.enabled = True
    mock_ai.config = {"bot_token": "token", "guild_id": "123", "channel_id": "456", "content": "hi"}
    agent.agent_integrations = [mock_ai]
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    tool_types = [type(t).__name__ for t in tools]
    assert "DiscordGetServerInfoTool" in tool_types
    assert "DiscordSendMessageTool" in tool_types

@pytest.mark.asyncio
async def test_get_crew_llm() -> None:
    llm = CrewOrchestrator.get_crew_llm()
    assert llm.supports_function_calling() is True
    pass

@pytest.mark.asyncio
async def test_crew_orchestrator_raises_value_error_empty_agents() -> None:
    with pytest.raises(ValueError, match="No agents available to execute the task."):
        await CrewOrchestrator.execute_crew_task(
            [],
            "Hello",
            uuid4()
        )
