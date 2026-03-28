"""Tests for API clients error branches to increase coverage."""
from __future__ import annotations

from unittest.mock import patch
import httpx
import pytest

from app.infrastructure.external.spotify import (
    get_currently_playing,
    get_recently_played,
    search_spotify,
)
from app.infrastructure.external.discord import (
    get_server_info,
    send_message,
)

@pytest.fixture
def token() -> str:
    return "token"

@pytest.mark.asyncio
async def test_spotify_currently_playing_errors(token: str) -> None:
    # missing item
    with patch("app.infrastructure.external.spotify._get_async", return_value={"is_playing": False}):
        res = await get_currently_playing(token)
        assert res is None

    # RequestError
    with patch("app.infrastructure.external.spotify._get_async", side_effect=httpx.RequestError("error")):
        res = await get_currently_playing(token)
        assert res is None

    # Other exception
    with patch("app.infrastructure.external.spotify._get_async", side_effect=ValueError("bad")):
        res = await get_currently_playing(token)
        assert res is None

@pytest.mark.asyncio
async def test_spotify_recently_played_errors(token: str) -> None:
    # None return
    with patch("app.infrastructure.external.spotify._get_async", return_value=None):
        res = await get_recently_played(token)
        assert res == []

    # RequestError
    with patch("app.infrastructure.external.spotify._get_async", side_effect=httpx.RequestError("error")):
        res = await get_recently_played(token)
        assert res == []

    # Other exception
    with patch("app.infrastructure.external.spotify._get_async", side_effect=ValueError("bad")):
        res = await get_recently_played(token)
        assert res == []

@pytest.mark.asyncio
async def test_spotify_search_errors(token: str) -> None:
    # None return
    with patch("app.infrastructure.external.spotify._get_async", return_value=None):
        res = await search_spotify(token, "x")
        assert res == []

    # RequestError
    with patch("app.infrastructure.external.spotify._get_async", side_effect=httpx.RequestError("error")):
        res = await search_spotify(token, "x")
        assert res == []

    # Other exception
    with patch("app.infrastructure.external.spotify._get_async", side_effect=ValueError("bad")):
        res = await search_spotify(token, "x")
        assert res == []

@pytest.mark.asyncio
async def test_discord_server_info_errors(token: str) -> None:
    # None return
    with patch("app.infrastructure.external.discord._get_async", return_value=None):
        res = await get_server_info(token, "1")
        assert res is None

    # RequestError
    with patch("app.infrastructure.external.discord._get_async", side_effect=httpx.RequestError("error")):
        res = await get_server_info(token, "1")
        assert res is None

    # Other exception
    with patch("app.infrastructure.external.discord._get_async", side_effect=ValueError("bad")):
        res = await get_server_info(token, "1")
        assert res is None

@pytest.mark.asyncio
async def test_discord_send_message_errors(token: str) -> None:
    # RequestError
    with patch("app.infrastructure.external.discord._post_async", side_effect=httpx.RequestError("error")):
        res = await send_message(token, "1", "msg")
        assert res is False

    # Other exception
    with patch("app.infrastructure.external.discord._post_async", side_effect=ValueError("bad")):
        res = await send_message(token, "1", "msg")
        assert res is False


@pytest.mark.asyncio
async def test_discord_get_async_status_error(token: str) -> None:
    # HTTPStatusError
    with patch("app.infrastructure.external.discord._get_async", side_effect=httpx.HTTPStatusError("error", request=httpx.Request("GET", "url"), response=httpx.Response(400, request=httpx.Request("GET", "url")))):
        res = await get_server_info(token, "1")
        assert res is None

@pytest.mark.asyncio
async def test_discord_post_async_status_error(token: str) -> None:
    # HTTPStatusError
    with patch("app.infrastructure.external.discord._post_async", side_effect=httpx.HTTPStatusError("error", request=httpx.Request("POST", "url"), response=httpx.Response(400, request=httpx.Request("POST", "url")))):
        res = await send_message(token, "1", "msg")
        assert res is False

@pytest.mark.asyncio
async def test_spotify_get_async_status_error(token: str) -> None:
    # HTTPStatusError
    with patch("app.infrastructure.external.spotify._get_async", side_effect=httpx.HTTPStatusError("error", request=httpx.Request("GET", "url"), response=httpx.Response(400, request=httpx.Request("GET", "url")))):
        res1 = await get_currently_playing(token)
        assert res1 is None

        res2 = await get_recently_played(token)
        assert res2 == []

        res3 = await search_spotify(token, "x")
        assert res3 == []
