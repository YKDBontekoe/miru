"""Spotify Web API client."""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

SPOTIFY_API_BASE = "https://api.spotify.com/v1"


async def _get_async(
    url: str, headers: dict[str, str], params: dict[str, Any] | None = None
) -> Any:
    """Asynchronous GET with httpx; returns parsed JSON or raises."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=headers, params=params)
        # 204 No Content for empty responses (like currently playing when nothing is playing)
        if resp.status_code == 204:
            return None
        resp.raise_for_status()
        return resp.json()


async def get_currently_playing(access_token: str) -> dict[str, Any] | None:
    """Fetch currently playing track for a Spotify user."""
    url = f"{SPOTIFY_API_BASE}/me/player/currently-playing"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        data = await _get_async(url, headers)
        if not data:
            return None

        # Parse relevant information
        item = data.get("item", {})
        if not item:
            return None

        artists = [artist.get("name") for artist in item.get("artists", [])]
        track_name = item.get("name")
        album = item.get("album", {}).get("name")
        is_playing = data.get("is_playing", False)

        return {
            "track": track_name,
            "artists": artists,
            "album": album,
            "is_playing": is_playing,
            "url": item.get("external_urls", {}).get("spotify"),
        }
    except httpx.HTTPStatusError as e:
        logger.exception(f"Spotify API returned error status: {e.response.status_code}")
        return None
    except httpx.RequestError:
        logger.exception("Failed to fetch Spotify currently playing")
        return None
    except Exception:
        logger.exception("Unexpected error fetching Spotify currently playing")
        return None


async def get_recently_played(access_token: str, limit: int = 10) -> list[dict[str, Any]]:
    """Fetch recently played tracks for a Spotify user."""
    url = f"{SPOTIFY_API_BASE}/me/player/recently-played"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": limit}

    try:
        data = await _get_async(url, headers, params)
        if not data:
            return []

        tracks = []
        for item in data.get("items", []):
            track_data = item.get("track", {})
            artists = [artist.get("name") for artist in track_data.get("artists", [])]
            tracks.append(
                {
                    "track": track_data.get("name"),
                    "artists": artists,
                    "album": track_data.get("album", {}).get("name"),
                    "played_at": item.get("played_at"),
                    "url": track_data.get("external_urls", {}).get("spotify"),
                }
            )

        return tracks
    except httpx.HTTPStatusError as e:
        logger.exception(f"Spotify API returned error status: {e.response.status_code}")
        return []
    except httpx.RequestError:
        logger.exception("Failed to fetch Spotify recently played tracks")
        return []
    except Exception:
        logger.exception("Unexpected error fetching Spotify recently played tracks")
        return []


async def search_spotify(
    access_token: str, query: str, item_type: str = "track", limit: int = 5
) -> list[dict[str, Any]]:
    """Search Spotify for tracks, artists, etc."""
    url = f"{SPOTIFY_API_BASE}/search"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"q": query, "type": item_type, "limit": limit}

    try:
        data = await _get_async(url, headers, params)
        if not data:
            return []

        results = []

        # Handle different item types based on the key Spotify returns
        type_key = f"{item_type}s"
        items = data.get(type_key, {}).get("items", [])

        for item in items:
            result = {
                "name": item.get("name"),
                "type": item_type,
                "url": item.get("external_urls", {}).get("spotify"),
            }

            if item_type == "track" or item_type == "album":
                result["artists"] = [artist.get("name") for artist in item.get("artists", [])]

            results.append(result)

        return results
    except httpx.HTTPStatusError as e:
        logger.exception(f"Spotify API returned error status: {e.response.status_code}")
        return []
    except httpx.RequestError:
        logger.exception("Failed to search Spotify")
        return []
    except Exception:
        logger.exception("Unexpected error searching Spotify")
        return []
