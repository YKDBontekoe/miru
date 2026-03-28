"""CrewAI tools for Spotify Web API."""

from __future__ import annotations

import asyncio
import json
import logging
import typing

import nest_asyncio
from crewai.tools import BaseTool
from pydantic import Field

from app.infrastructure.external.spotify import (
    add_tracks_to_playlist,
    create_playlist,
    get_currently_playing,
    get_recently_played,
    get_recommendations,
    search_spotify,
)


def _run_async_in_sync(coro: typing.Coroutine[typing.Any, typing.Any, typing.Any]) -> typing.Any:
    """Run an async coroutine synchronously using nest_asyncio."""
    try:
        asyncio.get_running_loop()
        nest_asyncio.apply()
    except RuntimeError:
        # No running event loop expected when called synchronously
        pass
    return asyncio.run(coro)


logger = logging.getLogger(__name__)


class SpotifyCurrentlyPlayingTool(BaseTool):
    """Tool to fetch a Spotify user's currently playing track."""

    name: str = "spotify_currently_playing"
    description: str = (
        "Fetch the currently playing track for a Spotify user. "
        "Requires a valid Spotify access token."
    )

    access_token: str = Field(..., description="The Spotify OAuth access token.")

    def _run(self) -> str:
        """Run the tool synchronously."""
        return _run_async_in_sync(self._arun())

    async def _arun(self) -> str:
        """Async implementation of the tool."""
        try:
            track = await get_currently_playing(self.access_token)
            if not track:
                return "No track is currently playing."

            return json.dumps(track, indent=2)
        except Exception as e:
            return f"Error fetching currently playing track: {e!s}"


class SpotifyRecentlyPlayedTool(BaseTool):
    """Tool to fetch a Spotify user's recently played tracks."""

    name: str = "spotify_recently_played"
    description: str = (
        "Fetch the recently played tracks for a Spotify user. "
        "Requires a valid Spotify access token."
    )

    access_token: str = Field(..., description="The Spotify OAuth access token.")

    def _run(self) -> str:
        """Run the tool synchronously."""
        return _run_async_in_sync(self._arun())

    async def _arun(self) -> str:
        """Async implementation of the tool.

        Returns:
            str: JSON formatted response or error message.
        """
        try:
            tracks = await get_recently_played(self.access_token)
            if not tracks:
                return "No recently played tracks found."

            return json.dumps(tracks, indent=2)
        except Exception as e:
            return f"Error fetching recently played tracks: {e!s}"


class SpotifySearchTool(BaseTool):
    """Tool to search Spotify for tracks, artists, or albums."""

    name: str = "spotify_search"
    description: str = (
        "Search Spotify for tracks, artists, or albums. "
        "Requires a query string and a valid Spotify access token."
    )

    query: str = Field(
        default="", description="The search query (e.g., 'artist:muse track:madness')."
    )
    access_token: str = Field(..., description="The Spotify OAuth access token.")
    item_type: str = Field(
        default="track",
        description="Type of item to search for: 'album', 'artist', 'playlist', 'track', 'show', 'episode', 'audiobook'. Defaults to 'track'.",
    )

    def _run(self) -> str:
        """Run the tool synchronously."""
        return _run_async_in_sync(self._arun())

    async def _arun(self) -> str:
        """Async implementation of the tool.

        Returns:
            str: JSON formatted response or error message.
        """
        if not self.query:
            return "Error: query is required."
        try:
            results = await search_spotify(self.access_token, self.query, self.item_type)
            if not results:
                return f"No results found for query: {self.query}"

            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error searching Spotify: {e!s}"


class SpotifyCreatePlaylistTool(BaseTool):
    """Tool to create a new private Spotify playlist."""

    name: str = "spotify_create_playlist"
    description: str = (
        "Create a new private Spotify playlist for the user. "
        "Requires Spotify integration to be active with 'playlist-modify-private' scope. "
        "Returns the playlist ID which can be used to add tracks."
    )
    access_token: str = Field(..., description="The user's Spotify OAuth access token.")

    def _run(self, name: str, description: str = "") -> str:
        """Create a new playlist."""
        result = _run_async_in_sync(create_playlist(self.access_token, name, description))
        if isinstance(result, dict) and "error" in result:
            return f"Failed to create playlist: {result['error']}"
        elif isinstance(result, dict):
            pid = result.get("id")
            return f"Successfully created playlist '{name}'. ID: {pid}"
        return "Failed to parse response."


class SpotifyAddTracksToPlaylistTool(BaseTool):
    """Tool to add tracks to a Spotify playlist."""

    name: str = "spotify_add_tracks_to_playlist"
    description: str = (
        "Add one or more tracks to a Spotify playlist. "
        "Requires the playlist ID and a comma-separated list of track URIs (e.g. 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh')."
    )
    access_token: str = Field(..., description="The user's Spotify OAuth access token.")

    def _run(self, playlist_id: str, track_uris: str) -> str:
        """Add tracks to playlist."""
        uris_list = [
            uri.strip() for uri in track_uris.split(",") if uri.strip().startswith("spotify:track:")
        ]
        if not uris_list:
            return "No valid track URIs provided. Must start with 'spotify:track:'"

        import json

        result = _run_async_in_sync(
            add_tracks_to_playlist(self.access_token, playlist_id, uris_list)
        )
        if isinstance(result, dict) and "error" in result:
            return json.dumps({"success": False, "error": result["error"]})
        return json.dumps(
            {
                "success": True,
                "track_count": len(uris_list),
                "message": "Successfully added tracks to the playlist",
            }
        )


class SpotifyGetRecommendationsTool(BaseTool):
    """Tool to get track recommendations."""

    name: str = "spotify_get_recommendations"
    description: str = (
        "Get track recommendations based on seed artists, genres, or tracks. "
        "Provide at least one comma-separated list of IDs for seeds. "
        "Example seeds: seed_artists='4NHQUGzhtTLFxgP59SMwvd', seed_genres='classical,jazz'."
    )
    access_token: str = Field(..., description="The user's Spotify OAuth access token.")

    def _run(
        self, seed_artists: str = "", seed_genres: str = "", seed_tracks: str = "", limit: int = 10
    ) -> str:
        """Get recommendations."""
        sa = seed_artists if seed_artists else None
        sg = seed_genres if seed_genres else None
        st = seed_tracks if seed_tracks else None

        result = _run_async_in_sync(get_recommendations(self.access_token, sa, sg, st, limit))

        import json

        if isinstance(result, dict) and "error" in result:
            return json.dumps({"success": False, "error": result["error"]})

        if not isinstance(result, dict) or "tracks" not in result or not result["tracks"]:
            return json.dumps({"success": True, "items": []})

        items = []
        for t in result["tracks"]:
            t_name = t.get("name", "Unknown")
            artists = ", ".join([a.get("name", "Unknown") for a in t.get("artists", [])])
            uri = t.get("uri", "")
            items.append({"name": t_name, "artists": artists, "uri": uri})

        return json.dumps({"success": True, "items": items})
