from __future__ import annotations

from unittest.mock import AsyncMock, Mock, patch

import httpx
import pytest

from app.infrastructure.external.steam_client import SteamClient


@pytest.fixture
def steam_client():
    return SteamClient()


@pytest.mark.asyncio
async def test_get_player_summaries_success(steam_client):
    mock_data = {
        "response": {"players": [{"steamid": "12345", "personaname": "TestUser"}]}
    }

    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_response = Mock()
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status.return_value = None

        mock_get = AsyncMock(return_value=mock_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_player_summaries(["12345"])

    assert len(result) == 1
    assert result[0]["steamid"] == "12345"
    assert result[0]["personaname"] == "TestUser"


@pytest.mark.asyncio
async def test_get_player_summaries_no_key(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key=None)):
        result = await steam_client.get_player_summaries(["12345"])
    assert result == []


@pytest.mark.asyncio
async def test_get_player_summaries_empty_ids(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        result = await steam_client.get_player_summaries([])
    assert result == []


@pytest.mark.asyncio
async def test_get_player_summaries_http_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError("Error", request=Mock(), response=Mock())

        mock_get = AsyncMock(return_value=mock_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_player_summaries(["12345"])
    assert result == []


@pytest.mark.asyncio
async def test_get_player_summaries_request_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_get = AsyncMock(side_effect=httpx.RequestError("Error", request=Mock()))
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_player_summaries(["12345"])
    assert result == []


@pytest.mark.asyncio
async def test_get_player_summaries_unexpected_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_get = AsyncMock(side_effect=Exception("Unexpected"))
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_player_summaries(["12345"])
    assert result == []


@pytest.mark.asyncio
async def test_get_owned_games_success(steam_client):
    mock_data = {
        "response": {"games": [{"appid": 10, "name": "Counter-Strike"}]}
    }

    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_response = Mock()
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status.return_value = None

        mock_get = AsyncMock(return_value=mock_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_owned_games("12345")

    assert len(result) == 1
    assert result[0]["appid"] == 10
    assert result[0]["name"] == "Counter-Strike"


@pytest.mark.asyncio
async def test_get_owned_games_no_key(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key=None)):
        result = await steam_client.get_owned_games("12345")
    assert result == []


@pytest.mark.asyncio
async def test_get_owned_games_http_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError("Error", request=Mock(), response=Mock())

        mock_get = AsyncMock(return_value=mock_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_owned_games("12345")
    assert result == []


@pytest.mark.asyncio
async def test_get_owned_games_request_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_get = AsyncMock(side_effect=httpx.RequestError("Error", request=Mock()))
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_owned_games("12345")
    assert result == []


@pytest.mark.asyncio
async def test_get_owned_games_unexpected_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_get = AsyncMock(side_effect=Exception("Unexpected"))
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.get_owned_games("12345")
    assert result == []


@pytest.mark.asyncio
async def test_resolve_vanity_url_success(steam_client):
    mock_data = {
        "response": {"success": 1, "steamid": "12345678901234567"}
    }

    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_response = Mock()
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status.return_value = None

        mock_get = AsyncMock(return_value=mock_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.resolve_vanity_url("test_vanity")

    assert result == "12345678901234567"


@pytest.mark.asyncio
async def test_resolve_vanity_url_failure(steam_client):
    mock_data = {
        "response": {"success": 42, "message": "No match"}
    }

    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_response = Mock()
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status.return_value = None

        mock_get = AsyncMock(return_value=mock_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.resolve_vanity_url("test_vanity")

    assert result is None


@pytest.mark.asyncio
async def test_resolve_vanity_url_no_key(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key=None)):
        result = await steam_client.resolve_vanity_url("test_vanity")
    assert result is None


@pytest.mark.asyncio
async def test_resolve_vanity_url_unexpected_error(steam_client):
    with patch("app.infrastructure.external.steam_client.get_settings", return_value=Mock(steam_api_key="test_key")):
        mock_get = AsyncMock(side_effect=Exception("Unexpected"))
        with patch("httpx.AsyncClient.get", new=mock_get):
            result = await steam_client.resolve_vanity_url("test_vanity")
    assert result is None
