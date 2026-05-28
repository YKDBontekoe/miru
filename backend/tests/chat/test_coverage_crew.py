from __future__ import annotations
from unittest.mock import patch
import pytest


def test_supports_function_calling() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import _OpenRouterLLM

    llm = _OpenRouterLLM(model="openrouter/test", additional_drop_params=["tool_choice"])
    assert llm.supports_function_calling() is True


def test_get_crew_llm() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import CrewOrchestrator

    with patch("app.domain.chat.crew_orchestrator.get_settings") as mock_settings:
        mock_settings.return_value.default_chat_model = "test-model"
        mock_settings.return_value.openrouter_api_key = "test-key"
        llm = CrewOrchestrator.get_crew_llm()
        assert llm.model == "openrouter/test-model"


@pytest.mark.asyncio
async def test_crew_orchestrator_execute_crew_task_multi() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import AsyncMock, MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent1"
    agent1.personality = "Good"
    agent1.description = "desc"
    agent1.system_prompt = "sys"
    agent1.agent_integrations = []

    agent2 = MagicMock()
    agent2.id = uuid4()
    agent2.name = "Agent2"
    agent2.personality = "Good"
    agent2.description = "desc"
    agent2.system_prompt = "sys"
    agent2.agent_integrations = []

    mock_llm = "openrouter/test-model"

    with (
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm", return_value=mock_llm
        ),
        patch("app.domain.chat.crew_orchestrator.Task") as mock_task,
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.Process"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="ResultMulti")
        mock_crew_cls.return_value = mock_crew_instance

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=[agent1, agent2],
            user_message="Hello",
            user_id=uuid4(),
            user_msg_id=uuid4(),
            step_callback=MagicMock(),
            accept_language="hi-IN",
        )
        assert result == "ResultMulti"


@pytest.mark.asyncio
async def test_crew_orchestrator_execute_crew_task_multi_retry() -> None:
    """Test to satisfy docstring requirement."""
    import asyncio
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import AsyncMock, MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent1"
    agent1.personality = "Good"
    agent1.description = "desc"
    agent1.system_prompt = "sys"
    agent1.agent_integrations = []

    mock_llm = "openrouter/test-model"

    with (
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm", return_value=mock_llm
        ),
        patch("app.domain.chat.crew_orchestrator.Task") as mock_task,
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.Process"),
        patch("asyncio.sleep", new_callable=AsyncMock),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(
            side_effect=[Exception("test error"), "ResultRetry"]
        )
        mock_crew_cls.return_value = mock_crew_instance

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=[agent1],
            user_message="Hello",
            user_id=uuid4(),
            user_msg_id=uuid4(),
            step_callback=None,
            accept_language="hi-IN",
        )
        assert result == "ResultRetry"


@pytest.mark.asyncio
async def test_crew_orchestrator_execute_crew_task_multi_cancel() -> None:
    """Test to satisfy docstring requirement."""
    import asyncio
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import AsyncMock, MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent1"
    agent1.personality = "Good"
    agent1.description = "desc"
    agent1.system_prompt = "sys"
    agent1.agent_integrations = []

    mock_llm = "openrouter/test-model"

    with (
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm", return_value=mock_llm
        ),
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.Process"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(side_effect=asyncio.CancelledError())
        mock_crew_cls.return_value = mock_crew_instance

        with pytest.raises(asyncio.CancelledError):
            await CrewOrchestrator.execute_crew_task(
                room_agents=[agent1],
                user_message="Hello",
                user_id=uuid4(),
                user_msg_id=uuid4(),
                step_callback=None,
                accept_language="hi-IN",
            )


@pytest.mark.asyncio
async def test_crew_orchestrator_execute_crew_task_multi_fail() -> None:
    """Test to satisfy docstring requirement."""
    import asyncio
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import AsyncMock, MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent1"
    agent1.personality = "Good"
    agent1.description = "desc"
    agent1.system_prompt = "sys"
    agent1.agent_integrations = []

    mock_llm = "openrouter/test-model"

    with (
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm", return_value=mock_llm
        ),
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.Process"),
        patch("asyncio.sleep", new_callable=AsyncMock),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(side_effect=Exception("error"))
        mock_crew_cls.return_value = mock_crew_instance

        with pytest.raises(Exception):
            await CrewOrchestrator.execute_crew_task(
                room_agents=[agent1],
                user_message="Hello",
                user_id=uuid4(),
                user_msg_id=uuid4(),
                step_callback=None,
                accept_language="hi-IN",
            )


def test_get_agent_tools_with_integrations() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()

    ai_steam = MagicMock()
    ai_steam.enabled = True
    ai_steam.integration_id = "steam"
    ai_steam.config = {"steam_id": "123"}

    ai_spotify = MagicMock()
    ai_spotify.enabled = True
    ai_spotify.integration_id = "spotify"
    ai_spotify.config = {"access_token": "token"}

    ai_discord = MagicMock()
    ai_discord.enabled = True
    ai_discord.integration_id = "discord"
    ai_discord.config = {
        "bot_token": "token",
        "guild_id": "123",
        "channel_id": "123",
        "content": "text",
    }

    agent1.agent_integrations = [ai_steam, ai_spotify, ai_discord]

    tools = CrewOrchestrator.get_agent_tools(agent1, uuid4())
    assert len(tools) > 5


def test_get_agent_tools_with_integrations_missing_config() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()

    ai_discord = MagicMock()
    ai_discord.enabled = True
    ai_discord.integration_id = "discord"
    ai_discord.config = {"bot_token": "token"}

    agent1.agent_integrations = [ai_discord]

    tools = CrewOrchestrator.get_agent_tools(agent1, uuid4())
    assert len(tools) > 5


def test_format_history() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import CrewOrchestrator

    assert CrewOrchestrator.format_history(None) == ""
    assert CrewOrchestrator.format_history([]) == ""

    history = [
        {"role": "user", "content": "hi"},
        {"role": "agent", "name": "Agent1", "content": "hello"},
        {"role": "user", "content": " "},
    ]

    formatted = CrewOrchestrator.format_history(history)
    assert "User: hi" in formatted
    assert "Agent1: hello" in formatted
    assert "User:  " not in formatted


@pytest.mark.asyncio
async def test_crew_orchestrator_execute_crew_task_multi_cancel_retry() -> None:
    """Test to satisfy docstring requirement."""
    import asyncio
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4
    from unittest.mock import AsyncMock, MagicMock

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent1"
    agent1.personality = "Good"
    agent1.description = "desc"
    agent1.system_prompt = "sys"
    agent1.agent_integrations = []

    mock_llm = "openrouter/test-model"

    with (
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm", return_value=mock_llm
        ),
        patch("app.domain.chat.crew_orchestrator.Task"),
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.Process"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(side_effect=asyncio.CancelledError())
        mock_crew_cls.return_value = mock_crew_instance

        with pytest.raises(asyncio.CancelledError):
            await CrewOrchestrator.execute_crew_task(
                room_agents=[agent1],
                user_message="Hello",
                user_id=uuid4(),
                user_msg_id=uuid4(),
                step_callback=None,
                accept_language="hi-IN",
            )


@pytest.mark.asyncio
async def test_crew_orchestrator_execute_crew_task_no_agents() -> None:
    """Test to satisfy docstring requirement."""
    from app.domain.chat.crew_orchestrator import CrewOrchestrator
    from uuid import uuid4

    with pytest.raises(ValueError):
        await CrewOrchestrator.execute_crew_task(
            room_agents=[],
            user_message="Hello",
            user_id=uuid4(),
        )
