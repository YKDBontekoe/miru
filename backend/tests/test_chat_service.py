"""Tests for ChatService logic."""

from __future__ import annotations

import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock

from app.domain.chat.service import ChatService
from app.domain.agents.models import Agent

@pytest.fixture
def chat_service():
    chat_repo = AsyncMock()
    agent_repo = AsyncMock()
    memory_repo = AsyncMock()
    return ChatService(chat_repo, agent_repo, memory_repo)

def test_get_agent_tools(chat_service):
    # Agent with no integrations
    agent1 = Agent(
        id=uuid4(),
        user_id=uuid4(),
        name="Agent 1",
        personality="Helpful",
        integrations=[]
    )
    tools = chat_service._get_agent_tools(agent1)
    assert len(tools) == 0

    # Agent with steam integration
    steam_id = "12345678901234567"
    agent2 = Agent(
        id=uuid4(),
        user_id=uuid4(),
        name="Agent 2",
        personality="Gamer",
        integrations=[f"steam:{steam_id}", "other"]
    )
    tools = chat_service._get_agent_tools(agent2)
    assert len(tools) == 2
    assert tools[0].name == "steam_player_summary"
    assert tools[1].name == "steam_owned_games"
