"""Tests for Steam Web API client."""

import typing
from unittest.mock import MagicMock, patch

import pytest

from app.infrastructure.external.steam import SteamAPIClient


@pytest.fixture
def mock_settings() -> typing.Generator[typing.Any, None, None]:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = "test_steam_key"
        yield mock


@pytest.fixture
def steam_client() -> SteamAPIClient:
    return SteamAPIClient()


@pytest.mark.asyncio
async def test_get_player_summaries(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    steam_id = "76561197960435530"
    mock_data = {"response": {"players": [{"personaname": "Robin", "personastate": 1}]}}

    with patch.object(steam_client, "_get_async", return_value=mock_data) as mock_get:
        summaries = await steam_client.get_player_summaries([steam_id])

        assert len(summaries) == 1
        assert summaries[0]["personaname"] == "Robin"
        mock_get.assert_called_once()
        url, params = mock_get.call_args[0]
        assert steam_id in params["steamids"]
        assert params["key"] == "test_steam_key"


@pytest.mark.asyncio
async def test_get_owned_games(mock_settings: typing.Any, steam_client: SteamAPIClient) -> None:
    steam_id = "76561197960435530"
    mock_data = {
        "response": {
            "game_count": 2,
            "games": [
                {"appid": 10, "name": "Counter-Strike"},
                {"appid": 440, "name": "Team Fortress 2"},
            ],
        }
    }

    with patch.object(steam_client, "_get_async", return_value=mock_data) as mock_get:
        games = await steam_client.get_owned_games(steam_id)

        assert len(games) == 2
        assert games[0]["name"] == "Counter-Strike"
        mock_get.assert_called_once()
        url, params = mock_get.call_args[0]
        assert params["steamid"] == steam_id
        assert params["key"] == "test_steam_key"


@pytest.mark.asyncio
async def test_get_player_summaries_no_key(steam_client: SteamAPIClient) -> None:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = None
        summaries = await steam_client.get_player_summaries(["76561197960435530"])
        assert summaries == []


@pytest.mark.asyncio
async def test_get_player_summaries_http_error(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    import httpx

    with patch.object(
        steam_client,
        "_get_async",
        side_effect=httpx.HTTPStatusError(
            "403 Forbidden", request=MagicMock(), response=MagicMock()
        ),
    ):
        summaries = await steam_client.get_player_summaries(["76561197960435530"])
        assert summaries == []


@pytest.mark.asyncio
async def test_get_player_summaries_exception(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    with patch.object(steam_client, "_get_async", side_effect=Exception("Unexpected error")):
        summaries = await steam_client.get_player_summaries(["76561197960435530"])
        assert summaries == []


@pytest.mark.asyncio
async def test_get_player_summaries_no_ids(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    summaries = await steam_client.get_player_summaries([])
    assert summaries == []


@pytest.mark.asyncio
async def test_get_owned_games_http_error(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    import httpx

    with patch.object(
        steam_client,
        "_get_async",
        side_effect=httpx.HTTPStatusError(
            "403 Forbidden", request=MagicMock(), response=MagicMock()
        ),
    ):
        games = await steam_client.get_owned_games("76561197960435530")
        assert games == []


@pytest.mark.asyncio
async def test_get_owned_games_exception(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    with patch.object(steam_client, "_get_async", side_effect=Exception("Unexpected error")):
        games = await steam_client.get_owned_games("76561197960435530")
        assert games == []


@pytest.mark.asyncio
async def test_get_owned_games_no_key(steam_client: SteamAPIClient) -> None:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = None
        games = await steam_client.get_owned_games("76561197960435530")
        assert games == []


@pytest.mark.asyncio
async def test_resolve_vanity_url_success(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    vanity_url = "robinwalker"
    mock_data = {"response": {"success": 1, "steamid": "76561197960435530"}}

    with patch.object(steam_client, "_get_async", return_value=mock_data) as mock_get:
        steam_id = await steam_client.resolve_vanity_url(vanity_url)

        assert steam_id == "76561197960435530"
        mock_get.assert_called_once()
        url, params = mock_get.call_args[0]
        assert params["vanityurl"] == vanity_url
        assert params["key"] == "test_steam_key"


@pytest.mark.asyncio
async def test_resolve_vanity_url_not_found(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    vanity_url = "nonexistent_url_12345"
    mock_data = {"response": {"success": 42, "message": "No match"}}

    with patch.object(steam_client, "_get_async", return_value=mock_data) as mock_get:
        steam_id = await steam_client.resolve_vanity_url(vanity_url)

        assert steam_id is None
        mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_resolve_vanity_url_no_key(steam_client: SteamAPIClient) -> None:
    with patch("app.infrastructure.external.steam.get_settings") as mock:
        mock.return_value.steam_api_key = None
        steam_id = await steam_client.resolve_vanity_url("robinwalker")
        assert steam_id is None


@pytest.mark.asyncio
async def test_resolve_vanity_url_exception(
    mock_settings: typing.Any, steam_client: SteamAPIClient
) -> None:
    with patch.object(steam_client, "_get_async", side_effect=Exception("Unexpected error")):
        steam_id = await steam_client.resolve_vanity_url("robinwalker")
        assert steam_id is None
