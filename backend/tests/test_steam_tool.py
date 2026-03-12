"""Tests for Steam CrewAI tools."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.infrastructure.external.steam_tool import SteamOwnedGamesTool, SteamPlayerSummaryTool


@pytest.fixture
def steam_id() -> str:
    return "76561197960435530"


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_player_summaries", new_callable=AsyncMock)
async def test_steam_player_summary_tool(mock_get_summaries, steam_id):
    """Test fetching player summary."""
    mock_get_summaries.return_value = [
        {
            "personaname": "Robin",
            "personastate": 1,
            "profileurl": "https://steamcommunity.com/id/robinwalker/",
        }
    ]

    tool = SteamPlayerSummaryTool(steam_id=steam_id)
    result = await tool._arun()

    assert "Robin" in result
    assert "Online" in result
    mock_get_summaries.assert_called_once_with([steam_id])


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_player_summaries", new_callable=AsyncMock)
async def test_steam_player_summary_tool_not_found(mock_get_summaries, steam_id):
    """Test handling when player is not found."""
    mock_get_summaries.return_value = []

    tool = SteamPlayerSummaryTool(steam_id=steam_id)
    result = await tool._arun()

    assert "No player found" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_owned_games", new_callable=AsyncMock)
async def test_steam_owned_games_tool(mock_get_games, steam_id):
    """Test fetching owned games."""
    mock_get_games.return_value = [
        {"appid": 440, "name": "Team Fortress 2", "playtime_forever": 600},
        {"appid": 10, "name": "Counter-Strike", "playtime_forever": 120},
    ]

    tool = SteamOwnedGamesTool(steam_id=steam_id)
    result = await tool._arun()

    assert "Team Fortress 2" in result
    assert "Counter-Strike" in result
    assert "10.0 hours" in result  # 600 minutes / 60
    assert "2.0 hours" in result  # 120 minutes / 60
    mock_get_games.assert_called_once_with(steam_id)


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_owned_games", new_callable=AsyncMock)
async def test_steam_owned_games_tool_empty(mock_get_games, steam_id):
    """Test handling when profile has no games or is private."""
    mock_get_games.return_value = []

    tool = SteamOwnedGamesTool(steam_id=steam_id)
    result = await tool._arun()

    assert "No games found or profile is private" in result
