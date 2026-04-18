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


def test_get_crew_llm() -> None:
    from app.domain.chat.crew_orchestrator import CrewOrchestrator

    with patch("app.domain.chat.crew_orchestrator.get_settings") as mock_settings:
        mock_settings.return_value.default_chat_model = "test-model"
        mock_settings.return_value.openrouter_api_key = "test-key"

        llm = CrewOrchestrator.get_crew_llm()
        assert llm.model == "openrouter/test-model"
        assert llm.base_url == "https://openrouter.ai/api/v1"
        assert llm.supports_function_calling() is True

def test_get_agent_tools_with_integrations() -> None:
    agent = MagicMock()
    agent.id = uuid4()

    mock_steam = MagicMock()
    mock_steam.integration_id = "steam"
    mock_steam.enabled = True
    mock_steam.config = {"steam_id": "123"}

    mock_spotify = MagicMock()
    mock_spotify.integration_id = "spotify"
    mock_spotify.enabled = True
    mock_spotify.config = {"access_token": "token123"}

    mock_discord = MagicMock()
    mock_discord.integration_id = "discord"
    mock_discord.enabled = True
    mock_discord.config = {"bot_token": "bot123", "guild_id": "guild123", "channel_id": "chan123", "content": "hi"}

    agent.agent_integrations = [mock_steam, mock_spotify, mock_discord]
    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    tool_types = [type(t).__name__ for t in tools]

    assert "SteamPlayerSummaryTool" in tool_types
    assert "SpotifyCurrentlyPlayingTool" in tool_types
    assert "DiscordGetServerInfoTool" in tool_types
    assert "DiscordSendMessageTool" in tool_types


def test_format_history() -> None:
    from app.domain.chat.crew_orchestrator import CrewOrchestrator

    history = [
        {"role": "user", "content": "hi"},
        {"role": "agent", "name": "Bot", "content": "hello there"},
        {"role": "agent", "name": "SilentBot", "content": "   "},
        {"role": "unknown", "content": "test"},
    ]
    formatted = CrewOrchestrator.format_history(history)
    assert formatted == "User: hi\nBot: hello there\nAgent: test"

    assert CrewOrchestrator.format_history(None) == ""
    assert CrewOrchestrator.format_history([]) == ""

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
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
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
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
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

        # Mock result to have pydantic output
        from app.domain.chat.crew_orchestrator import ChatResponse
        mock_result = MagicMock()
        mock_result.pydantic = ChatResponse(message="Result")

        mock_crew_instance.kickoff_async = AsyncMock(return_value=mock_result)
        mock_crew_cls.return_value = mock_crew_instance
        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="ja-JP",
        )
        assert result == "Result"


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

        # Mock result to have pydantic output
        from app.domain.chat.crew_orchestrator import AgentReply, MultiAgentChatResponse
        mock_result = MagicMock()
        mock_result.pydantic = MultiAgentChatResponse(
            replies=[AgentReply(agent="Agent1", message="ResultMulti")]
        )

        mock_crew_instance.kickoff_async = AsyncMock(return_value=mock_result)
        mock_crew_cls.return_value = mock_crew_instance
        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="hi-IN",
        )
        assert result == "Agent1: ResultMulti"


@pytest.mark.asyncio
async def test_execute_crew_task_fallback_parsing(
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

        # Return something that fails pydantic type-check to hit the fallback
        mock_result = MagicMock()
        mock_result.pydantic = None
        mock_result.raw = "Fallback\\nString"
        mock_result.__str__.return_value = "Fallback\\nString"

        mock_crew_instance.kickoff_async = AsyncMock(return_value=mock_result)
        mock_crew_cls.return_value = mock_crew_instance
        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="ja-JP",
        )
        # Should have replaced \\n with \n
        assert result == "Fallback\nString"


@pytest.mark.asyncio
async def test_execute_crew_task_retry_logic(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        )
    ]
    user_id = uuid4()
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

        from app.domain.chat.crew_orchestrator import ChatResponse
        mock_result = MagicMock()
        mock_result.pydantic = ChatResponse(message="Success on attempt 2")

        # Throw an exception on the first call, return result on the second
        mock_crew_instance.kickoff_async = AsyncMock(
            side_effect=[Exception("Transient error"), mock_result]
        )
        mock_crew_cls.return_value = mock_crew_instance

        with patch("asyncio.sleep", AsyncMock()):
            result = await CrewOrchestrator.execute_crew_task(
                typing.cast("list[typing.Any]", room_agents),
                "Hello",
                user_id,
            )
        assert result == "Success on attempt 2"
        assert mock_crew_instance.kickoff_async.call_count == 2


@pytest.mark.asyncio
async def test_execute_crew_task_cancelled(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    import asyncio

    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        )
    ]
    user_id = uuid4()
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

        mock_crew_instance.kickoff_async = AsyncMock(
            side_effect=asyncio.CancelledError()
        )
        mock_crew_cls.return_value = mock_crew_instance

        with pytest.raises(asyncio.CancelledError):
            await CrewOrchestrator.execute_crew_task(
                typing.cast("list[typing.Any]", room_agents),
                "Hello",
                user_id,
            )


@pytest.mark.asyncio
async def test_execute_crew_task_all_retries_fail(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        )
    ]
    user_id = uuid4()
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

        mock_crew_instance.kickoff_async = AsyncMock(
            side_effect=[Exception("Transient error 1"), Exception("Transient error 2")]
        )
        mock_crew_cls.return_value = mock_crew_instance

        with patch("asyncio.sleep", AsyncMock()):
            with pytest.raises(Exception, match="Transient error 2"):
                await CrewOrchestrator.execute_crew_task(
                    typing.cast("list[typing.Any]", room_agents),
                    "Hello",
                    user_id,
                )
        assert mock_crew_instance.kickoff_async.call_count == 2


@pytest.mark.asyncio
async def test_execute_crew_task_no_agents() -> None:
    with pytest.raises(ValueError, match="No agents available"):
        await CrewOrchestrator.execute_crew_task(
            [],
            "Hello",
            uuid4(),
        )


@pytest.mark.asyncio
async def test_execute_crew_task_empty_result(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        )
    ]
    user_id = uuid4()
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
        mock_crew_instance.kickoff_async = AsyncMock(return_value=None)
        mock_crew_cls.return_value = mock_crew_instance

        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
        )
        assert result == "None"
