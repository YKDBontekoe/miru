"""More tests for Discord tools to increase coverage."""

from __future__ import annotations

import typing
from unittest.mock import AsyncMock, patch

import pytest
from app.infrastructure.external.discord_tool import (DiscordGetServerInfoTool,
                                                      DiscordSendMessageTool)


@pytest.fixture
def bot_token() -> str:
    return "test_bot_token"


@pytest.mark.asyncio
@patch("app.infrastructure.external.discord_tool.get_server_info", new_callable=AsyncMock)
async def test_discord_get_server_info_empty(mock_get: typing.Any, bot_token: str) -> None:
    mock_get.return_value = None
    tool = DiscordGetServerInfoTool(bot_token=bot_token, guild_id="123")
    result = await tool._arun()
    assert "Could not fetch info" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.discord_tool.get_server_info", new_callable=AsyncMock)
async def test_discord_get_server_info_error(mock_get: typing.Any, bot_token: str) -> None:
    mock_get.side_effect = Exception("API error")
    tool = DiscordGetServerInfoTool(bot_token=bot_token, guild_id="123")
    result = await tool._arun()
    assert "Error fetching Discord server info" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.discord_tool.send_message", new_callable=AsyncMock)
async def test_discord_send_message_failure(mock_send: typing.Any, bot_token: str) -> None:
    mock_send.return_value = False
    tool = DiscordSendMessageTool(bot_token=bot_token, channel_id="123", content="fail")
    result = await tool._arun()
    assert "Failed to send message" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.discord_tool.send_message", new_callable=AsyncMock)
async def test_discord_send_message_error(mock_send: typing.Any, bot_token: str) -> None:
    mock_send.side_effect = Exception("API error")
    tool = DiscordSendMessageTool(bot_token=bot_token, channel_id="123", content="err")
    result = await tool._arun()
    assert "Error sending Discord message" in result


def test_discord_server_info_sync(bot_token: str) -> None:
    tool = DiscordGetServerInfoTool(bot_token=bot_token, guild_id="123")
    with patch.object(tool, "_arun", return_value="Sync OK"):
        res = tool._run()
        assert res == "Sync OK"


def test_discord_send_message_sync(bot_token: str) -> None:
    tool = DiscordSendMessageTool(bot_token=bot_token, channel_id="123", content="test")
    with patch.object(tool, "_arun", return_value="Sync OK"):
        res = tool._run()
        assert res == "Sync OK"


def test_discord_get_server_info_sync_runtime_err(bot_token: str) -> None:
    tool = DiscordGetServerInfoTool(bot_token=bot_token, guild_id="123")
    with (
        patch("asyncio.get_running_loop", side_effect=RuntimeError),
        patch.object(tool, "_arun", return_value="Sync OK"),
    ):
        res = tool._run()
        assert res == "Sync OK"


def test_discord_send_message_sync_runtime_err(bot_token: str) -> None:
    tool = DiscordSendMessageTool(bot_token=bot_token, channel_id="123", content="fail")
    with (
        patch("asyncio.get_running_loop", side_effect=RuntimeError),
        patch.object(tool, "_arun", return_value="Sync OK"),
    ):
        res = tool._run()
        assert res == "Sync OK"
