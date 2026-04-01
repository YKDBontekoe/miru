"""Tests for Spotify Web API client."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from app.infrastructure.external.spotify import (get_currently_playing,
                                                 get_recently_played,
                                                 search_spotify)


@pytest.fixture
def access_token() -> str:
    return "test_spotify_access_token"


@pytest.mark.asyncio
async def test_get_currently_playing_success(access_token: str) -> None:
    mock_data = {
        "item": {
            "name": "Madness",
            "artists": [{"name": "Muse"}],
            "album": {"name": "The 2nd Law"},
            "external_urls": {"spotify": "https://open.spotify.com/track/test"},
        },
        "is_playing": True,
    }

    with patch(
        "app.infrastructure.external.spotify._get_async", return_value=mock_data
    ) as mock_get:
        track = await get_currently_playing(access_token)

        assert track is not None
        assert track["track"] == "Madness"
        assert track["artists"] == ["Muse"]
        assert track["album"] == "The 2nd Law"
        assert track["is_playing"] is True
        assert track["url"] == "https://open.spotify.com/track/test"

        mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_get_currently_playing_no_content(access_token: str) -> None:
    with patch("app.infrastructure.external.spotify._get_async", return_value=None):
        track = await get_currently_playing(access_token)

        assert track is None


@pytest.mark.asyncio
async def test_get_recently_played_success(access_token: str) -> None:
    mock_data = {
        "items": [
            {
                "track": {
                    "name": "Madness",
                    "artists": [{"name": "Muse"}],
                    "album": {"name": "The 2nd Law"},
                    "external_urls": {"spotify": "https://open.spotify.com/track/test"},
                },
                "played_at": "2023-10-01T12:00:00Z",
            }
        ]
    }

    with patch(
        "app.infrastructure.external.spotify._get_async", return_value=mock_data
    ) as mock_get:
        tracks = await get_recently_played(access_token)

        assert len(tracks) == 1
        assert tracks[0]["track"] == "Madness"
        assert tracks[0]["artists"] == ["Muse"]
        assert tracks[0]["album"] == "The 2nd Law"
        assert tracks[0]["played_at"] == "2023-10-01T12:00:00Z"
        assert tracks[0]["url"] == "https://open.spotify.com/track/test"

        mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_search_spotify_success(access_token: str) -> None:
    mock_data = {
        "tracks": {
            "items": [
                {
                    "name": "Madness",
                    "artists": [{"name": "Muse"}],
                    "external_urls": {"spotify": "https://open.spotify.com/track/test"},
                }
            ]
        }
    }

    with patch(
        "app.infrastructure.external.spotify._get_async", return_value=mock_data
    ) as mock_get:
        results = await search_spotify(access_token, "Madness", "track")

        assert len(results) == 1
        assert results[0]["name"] == "Madness"
        assert results[0]["type"] == "track"
        assert results[0]["artists"] == ["Muse"]
        assert results[0]["url"] == "https://open.spotify.com/track/test"

        mock_get.assert_called_once()
