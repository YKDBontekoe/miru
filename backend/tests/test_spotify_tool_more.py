"""More tests for Spotify tools to increase coverage."""

from __future__ import annotations

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
    return "test_token"


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.get_currently_playing", new_callable=AsyncMock)
async def test_spotify_currently_playing_error(mock_get: typing.Any, access_token: str) -> None:
    mock_get.side_effect = Exception("API error")
    tool = SpotifyCurrentlyPlayingTool(access_token=access_token)
    result = await tool._arun()
    assert "Error fetching currently playing track" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.get_recently_played", new_callable=AsyncMock)
async def test_spotify_recently_played_empty(mock_get: typing.Any, access_token: str) -> None:
    mock_get.return_value = []
    tool = SpotifyRecentlyPlayedTool(access_token=access_token)
    result = await tool._arun()
    assert "No recently played tracks found" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.get_recently_played", new_callable=AsyncMock)
async def test_spotify_recently_played_error(mock_get: typing.Any, access_token: str) -> None:
    mock_get.side_effect = Exception("API error")
    tool = SpotifyRecentlyPlayedTool(access_token=access_token)
    result = await tool._arun()
    assert "Error fetching recently played tracks" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.search_spotify", new_callable=AsyncMock)
async def test_spotify_search_empty(mock_search: typing.Any, access_token: str) -> None:
    mock_search.return_value = []
    tool = SpotifySearchTool(access_token=access_token, query="unknown")
    result = await tool._arun()
    assert "No results found" in result


@pytest.mark.asyncio
@patch("app.infrastructure.external.spotify_tool.search_spotify", new_callable=AsyncMock)
async def test_spotify_search_error(mock_search: typing.Any, access_token: str) -> None:
    mock_search.side_effect = Exception("API error")
    tool = SpotifySearchTool(access_token=access_token, query="err")
    result = await tool._arun()
    assert "Error searching Spotify" in result


def test_spotify_currently_playing_sync(access_token: str) -> None:
    tool = SpotifyCurrentlyPlayingTool(access_token=access_token)
    with patch.object(tool, "_arun", return_value="Sync OK"):
        res = tool._run()
        assert res == "Sync OK"


def test_spotify_recently_played_sync(access_token: str) -> None:
    tool = SpotifyRecentlyPlayedTool(access_token=access_token)
    with patch.object(tool, "_arun", return_value="Sync OK"):
        res = tool._run()
        assert res == "Sync OK"


def test_spotify_search_sync(access_token: str) -> None:
    tool = SpotifySearchTool(access_token=access_token, query="test")
    with patch.object(tool, "_arun", return_value="Sync OK"):
        res = tool._run()
        assert res == "Sync OK"


def test_spotify_currently_playing_sync_runtime_err(access_token: str) -> None:
    tool = SpotifyCurrentlyPlayingTool(access_token=access_token)
    with (
        patch("asyncio.get_running_loop", side_effect=RuntimeError),
        patch.object(tool, "_arun", return_value="Sync OK"),
    ):
        res = tool._run()
        assert res == "Sync OK"


def test_spotify_recently_played_sync_runtime_err(access_token: str) -> None:
    tool = SpotifyRecentlyPlayedTool(access_token=access_token)
    with (
        patch("asyncio.get_running_loop", side_effect=RuntimeError),
        patch.object(tool, "_arun", return_value="Sync OK"),
    ):
        res = tool._run()
        assert res == "Sync OK"


def test_spotify_search_sync_runtime_err(access_token: str) -> None:
    tool = SpotifySearchTool(access_token=access_token, query="test")
    with (
        patch("asyncio.get_running_loop", side_effect=RuntimeError),
        patch.object(tool, "_arun", return_value="Sync OK"),
    ):
        res = tool._run()
        assert res == "Sync OK"
