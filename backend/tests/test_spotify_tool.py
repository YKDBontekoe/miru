"""Tests for Spotify CrewAI tools."""

from __future__ import annotations

import json
import typing
from unittest.mock import AsyncMock, patch

import pytest

from app.infrastructure.external.spotify_tool import (
    SpotifyCurrentlyPlayingTool,
    SpotifyRecentlyPlayedTool,
    SpotifySearchTool,
)


@pytest.fixture
def access_token() -> str:
    return "test_spotify_access_token"


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.get_currently_playing", new_callable=AsyncMock)
async def test_spotify_currently_playing_tool(mock_get: typing.Any, access_token: str) -> None:
    """Test SpotifyCurrentlyPlayingTool success case."""
    mock_get.return_value = {
        "track": "Madness",
        "artists": ["Muse"],
        "album": "The 2nd Law",
        "is_playing": True,
        "url": "https://open.spotify.com/track/test",
    }

    tool = SpotifyCurrentlyPlayingTool(access_token=access_token)
    result_str = await tool._arun()
    result = json.loads(result_str)

    mock_get.assert_called_once_with(access_token)
    assert result["track"] == "Madness"
    assert result["artists"][0] == "Muse"


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.get_currently_playing", new_callable=AsyncMock)
async def test_spotify_currently_playing_tool_empty(
    mock_get: typing.Any, access_token: str
) -> None:
    """Test SpotifyCurrentlyPlayingTool when nothing is playing."""
    mock_get.return_value = None

    tool = SpotifyCurrentlyPlayingTool(access_token=access_token)
    result = await tool._arun()

    assert "No track is currently playing" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.get_recently_played", new_callable=AsyncMock)
async def test_spotify_recently_played_tool(mock_get: typing.Any, access_token: str) -> None:
    """Test SpotifyRecentlyPlayedTool success case."""
    mock_get.return_value = [
        {
            "track": "Madness",
            "artists": ["Muse"],
            "album": "The 2nd Law",
            "played_at": "2023-10-01T12:00:00Z",
            "url": "https://open.spotify.com/track/test",
        }
    ]

    tool = SpotifyRecentlyPlayedTool(access_token=access_token)
    result_str = await tool._arun()
    result = json.loads(result_str)

    mock_get.assert_called_once_with(access_token)
    assert len(result) == 1
    assert result[0]["track"] == "Madness"


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.search_spotify", new_callable=AsyncMock)
async def test_spotify_search_tool(mock_search: typing.Any, access_token: str) -> None:
    """Test SpotifySearchTool success case."""
    mock_search.return_value = [
        {
            "name": "Madness",
            "type": "track",
            "url": "https://open.spotify.com/track/test",
            "artists": ["Muse"],
        }
    ]

    tool = SpotifySearchTool(access_token=access_token, query="Madness", item_type="track")
    result_str = await tool._arun()
    result = json.loads(result_str)

    mock_search.assert_called_once_with(access_token, "Madness", "track")
    assert len(result) == 1
    assert result[0]["name"] == "Madness"
