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

            if item_type in ("track", "album"):
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


async def _post_async(
    url: str, headers: dict[str, str], json_data: dict[str, Any] | None = None
) -> Any:
    """Asynchronous POST with httpx; returns parsed JSON or raises."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=headers, json=json_data)
        if resp.status_code == 204:
            return None
        resp.raise_for_status()
        return resp.json()


async def get_user_profile(access_token: str) -> dict[str, Any]:
    """Get current user's profile."""
    url = f"{SPOTIFY_API_BASE}/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    return await _get_async(url, headers)


async def create_playlist(access_token: str, name: str, description: str = "") -> dict[str, Any]:
    """Create a new Spotify playlist for the user."""
    try:
        profile = await get_user_profile(access_token)
        user_id = profile.get("id")
        if not user_id:
            return {"error": "Could not determine Spotify user ID."}

        url = f"{SPOTIFY_API_BASE}/users/{user_id}/playlists"
        headers = {"Authorization": f"Bearer {access_token}"}
        payload = {
            "name": name,
            "description": description,
            "public": False,  # Default to private for safety
        }

        return await _post_async(url, headers, payload)
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to create playlist: {e.response.text}")
        return {"error": f"Spotify API error: {e.response.status_code}"}
    except Exception:
        logger.exception("Unexpected error creating playlist")
        return {"error": "Unexpected Spotify integration error"}


async def add_tracks_to_playlist(
    access_token: str, playlist_id: str, uris: list[str]
) -> dict[str, Any]:
    """Add items to a playlist."""
    try:
        url = f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/tracks"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {"uris": uris}

        result = await _post_async(url, headers, payload)
        return {"success": True, "snapshot_id": result.get("snapshot_id")}
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to add tracks: {e.response.text}")
        return {"error": f"Spotify API error: {e.response.status_code}"}
    except Exception:
        logger.exception("Unexpected error adding tracks")
        return {"error": "Unexpected Spotify integration error"}


async def get_recommendations(
    access_token: str,
    seed_artists: str | None = None,
    seed_genres: str | None = None,
    seed_tracks: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    """Get Recommendations Based on Seeds."""
    try:
        url = f"{SPOTIFY_API_BASE}/recommendations"
        headers = {"Authorization": f"Bearer {access_token}"}

        params: dict[str, Any] = {"limit": min(limit, 50)}
        if seed_artists:
            params["seed_artists"] = seed_artists
        if seed_genres:
            params["seed_genres"] = seed_genres
        if seed_tracks:
            params["seed_tracks"] = seed_tracks

        if not (seed_artists or seed_genres or seed_tracks):
            return {"error": "At least one seed (artist, genre, or track) must be provided."}

        return await _get_async(url, headers, params)
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to get recommendations: {e.response.text}")
        return {"error": f"Spotify API error: {e.response.status_code}"}
    except Exception:
        logger.exception("Unexpected error getting recommendations")
        return {"error": "Unexpected Spotify integration error"}
