"""Tests for Steam Web API client."""

import typing
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.infrastructure.external.steam import get_owned_games, get_player_summaries


@pytest.fixture
def mock_settings() -> typing.Generator[typing.Any, None, None]:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = "test_steam_key"
        yield mock


@pytest.mark.asyncio
async def test_get_player_summaries(mock_settings: typing.Any) -> None:
    steam_id = "76561197960435530"
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": {"players": [{"personaname": "Robin", "personastate": 1}]}
    }
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        summaries = await get_player_summaries([steam_id])

        assert len(summaries) == 1
        assert summaries[0]["personaname"] == "Robin"
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert steam_id in kwargs["params"]["steamids"]
        assert "test_steam_key" in kwargs["params"]["key"]


@pytest.mark.asyncio
async def test_get_owned_games(mock_settings: typing.Any) -> None:
    steam_id = "76561197960435530"
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": {
            "game_count": 2,
            "games": [
                {"appid": 10, "name": "Counter-Strike"},
                {"appid": 440, "name": "Team Fortress 2"},
            ],
        }
    }
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        games = await get_owned_games(steam_id)

        assert len(games) == 2
        assert games[0]["name"] == "Counter-Strike"
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert kwargs["params"]["steamid"] == steam_id
        assert "test_steam_key" in kwargs["params"]["key"]


@pytest.mark.asyncio
async def test_get_player_summaries_no_key() -> None:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = None
        summaries = await get_player_summaries(["76561197960435530"])
        assert summaries == []


@pytest.mark.asyncio
async def test_get_player_summaries_http_error(mock_settings: typing.Any) -> None:
    steam_id = "76561197960435530"

    mock_response = MagicMock()
    # Ensure raise_for_status raises HTTPError
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Error", request=MagicMock(), response=MagicMock()
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        summaries = await get_player_summaries([steam_id])
        assert summaries == []


@pytest.mark.asyncio
async def test_get_player_summaries_exception(mock_settings: typing.Any) -> None:
    steam_id = "76561197960435530"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = Exception("Unexpected error")
        summaries = await get_player_summaries([steam_id])
        assert summaries == []


@pytest.mark.asyncio
async def test_get_player_summaries_no_ids(mock_settings: typing.Any) -> None:
    summaries = await get_player_summaries([])
    assert summaries == []


@pytest.mark.asyncio
async def test_get_owned_games_http_error(mock_settings: typing.Any) -> None:
    steam_id = "76561197960435530"

    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Error", request=MagicMock(), response=MagicMock()
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        games = await get_owned_games(steam_id)
        assert games == []


@pytest.mark.asyncio
async def test_get_owned_games_exception(mock_settings: typing.Any) -> None:
    steam_id = "76561197960435530"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = Exception("Unexpected error")
        games = await get_owned_games(steam_id)
        assert games == []


@pytest.mark.asyncio
async def test_get_owned_games_no_key() -> None:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = None
        games = await get_owned_games("76561197960435530")
        assert games == []
