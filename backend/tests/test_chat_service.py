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

def test_openrouter_llm_initialization() -> None:
    """Test that _OpenRouterLLM can be initialized with an openrouter model without ImportError."""
    from app.domain.chat.service import _OpenRouterLLM

    # Should not raise ImportError due to missing litellm fallback
    llm = _OpenRouterLLM(
        model="openrouter/nvidia/nemotron-3-nano-30b-a3b:free",
        base_url="https://openrouter.ai/api/v1",
        api_key="test_api_key"
    )

    # We override supports_function_calling to return False in _OpenRouterLLM
    assert llm.supports_function_calling() is False
