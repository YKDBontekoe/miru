"""Tests for Discord Web API client."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.infrastructure.external.discord import (
    get_server_info,
    send_message,
)


@pytest.fixture
def bot_token() -> str:
    return "test_discord_bot_token"


@pytest.mark.asyncio
async def test_get_server_info_success(bot_token: str) -> None:
    mock_data = {
        "name": "Test Server",
        "description": "A server for testing",
        "approximate_member_count": 42,
        "id": "1234567890",
        "icon": "icon_hash",
    }

    with patch(
        "app.infrastructure.external.discord._get_async", return_value=mock_data
    ) as mock_get:
        info = await get_server_info(bot_token, "1234567890")

        assert info is not None
        assert info["name"] == "Test Server"
        assert info["description"] == "A server for testing"
        assert info["member_count"] == 42
        assert info["id"] == "1234567890"
        assert info["icon_url"] == "https://cdn.discordapp.com/icons/1234567890/icon_hash.png"

        mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_send_message_success(bot_token: str) -> None:
    mock_data = {"id": "1111111111", "content": "Hello, Discord!"}

    with patch(
        "app.infrastructure.external.discord._post_async", return_value=mock_data
    ) as mock_post:
        success = await send_message(bot_token, "9876543210", "Hello, Discord!")

        assert success is True

        mock_post.assert_called_once()
