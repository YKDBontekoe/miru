"""Tests for Discord CrewAI tools."""

from __future__ import annotations

import json
import typing
from unittest.mock import AsyncMock, patch

import pytest

from app.infrastructure.external.discord_tool import (
    DiscordGetServerInfoTool,
    DiscordSendMessageTool,
)


@pytest.fixture
def bot_token() -> str:
    return "test_discord_bot_token"


@pytest.mark.asyncio
@patch("app.infrastructure.external.discord_tool.get_server_info", new_callable=AsyncMock)
async def test_discord_get_server_info_tool(mock_get: typing.Any, bot_token: str) -> None:
    """Test DiscordGetServerInfoTool success case."""
    mock_get.return_value = {
        "name": "Test Server",
        "description": "A server for testing",
        "member_count": 42,
        "id": "1234567890",
        "icon_url": None,
    }

    tool = DiscordGetServerInfoTool(bot_token=bot_token, guild_id="1234567890")
    result_str = await tool._arun()
    result = json.loads(result_str)

    mock_get.assert_called_once_with(bot_token, "1234567890")
    assert result["name"] == "Test Server"
    assert result["member_count"] == 42


@pytest.mark.asyncio
@patch("app.infrastructure.external.discord_tool.send_message", new_callable=AsyncMock)
async def test_discord_send_message_tool(mock_send: typing.Any, bot_token: str) -> None:
    """Test DiscordSendMessageTool success case."""
    mock_send.return_value = True

    tool = DiscordSendMessageTool(
        bot_token=bot_token, channel_id="9876543210", content="Hello, Discord!"
    )
    result = await tool._arun()

    mock_send.assert_called_once_with(bot_token, "9876543210", "Hello, Discord!")
    assert "Message sent successfully" in result
