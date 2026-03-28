"""CrewAI tools for Spotify Web API."""

from __future__ import annotations

import asyncio
import json

import nest_asyncio
from crewai.tools import BaseTool
from pydantic import Field

from app.infrastructure.external.spotify import (
    get_currently_playing,
    get_recently_played,
    search_spotify,
)


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
        try:
            asyncio.get_running_loop()
            nest_asyncio.apply()
        except RuntimeError:
            pass
        return asyncio.run(self._arun())

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
        try:
            asyncio.get_running_loop()
            nest_asyncio.apply()
        except RuntimeError:
            pass
        return asyncio.run(self._arun())

    async def _arun(self) -> str:
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

    query: str = Field(..., description="The search query (e.g., 'artist:muse track:madness').")
    access_token: str = Field(..., description="The Spotify OAuth access token.")
    item_type: str = Field(
        default="track",
        description="Type of item to search for: 'album', 'artist', 'playlist', 'track', 'show', 'episode', 'audiobook'. Defaults to 'track'.",
    )

    def _run(self) -> str:
        """Run the tool synchronously."""
        try:
            asyncio.get_running_loop()
            nest_asyncio.apply()
        except RuntimeError:
            pass
        return asyncio.run(self._arun())

    async def _arun(self) -> str:
        try:
            results = await search_spotify(self.access_token, self.query, self.item_type)
            if not results:
                return f"No results found for query: {self.query}"

            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error searching Spotify: {e!s}"
