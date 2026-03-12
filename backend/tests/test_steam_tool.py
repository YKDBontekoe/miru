import typing
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
async def test_steam_player_summary_tool(mock_get_summaries: typing.Any, steam_id: str) -> None:
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
async def test_steam_player_summary_tool_not_found(mock_get_summaries: typing.Any, steam_id: str) -> None:
    """Test handling when player is not found."""
    mock_get_summaries.return_value = []

    tool = SteamPlayerSummaryTool(steam_id=steam_id)
    result = await tool._arun()

    assert "No player found" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_owned_games", new_callable=AsyncMock)
async def test_steam_owned_games_tool(mock_get_games: typing.Any, steam_id: str) -> None:
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
async def test_steam_owned_games_tool_empty(mock_get_games: typing.Any, steam_id: str) -> None:
    """Test handling when profile has no games or is private."""
    mock_get_games.return_value = []

    tool = SteamOwnedGamesTool(steam_id=steam_id)
    result = await tool._arun()

    assert "No games found or profile is private" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_player_summaries", new_callable=AsyncMock)
async def test_steam_player_summary_tool_exception(mock_get_summaries: typing.Any, steam_id: str) -> None:
    mock_get_summaries.side_effect = Exception("API error")
    tool = SteamPlayerSummaryTool(steam_id=steam_id)
    result = await tool._arun()
    assert "Error fetching player summary" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.steam_tool.get_owned_games", new_callable=AsyncMock)
async def test_steam_owned_games_tool_exception(mock_get_games: typing.Any, steam_id: str) -> None:
    mock_get_games.side_effect = Exception("API error")
    tool = SteamOwnedGamesTool(steam_id=steam_id)
    result = await tool._arun()
    assert "Error fetching owned games" in result


@patch("app.infrastructure.external.steam_tool.get_player_summaries")
def test_steam_player_summary_tool_sync(mock_get_summaries: typing.Any, steam_id: str) -> None:
    tool = SteamPlayerSummaryTool(steam_id=steam_id)

    with patch("asyncio.run") as mock_run:
        mock_run.return_value = "sync result"
        with patch.object(tool, "_arun", return_value="sync result"):
            result = tool._run()
        assert result == "sync result"


@patch("app.infrastructure.external.steam_tool.get_owned_games")
def test_steam_owned_games_tool_sync(mock_get_games: typing.Any, steam_id: str) -> None:
    tool = SteamOwnedGamesTool(steam_id=steam_id)

    with patch("asyncio.run") as mock_run:
        mock_run.return_value = "sync games result"
        with patch.object(tool, "_arun", return_value="sync result"):
            result = tool._run()
        assert result == "sync games result"
