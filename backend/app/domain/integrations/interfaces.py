"""Integrations Domain Interfaces."""

from __future__ import annotations

from typing import Any, Protocol


class SteamClientInterface(Protocol):
    """Interface for Steam API client."""

    async def get_player_summaries(self, steam_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch player summaries."""
        ...

    async def get_owned_games(
        self, steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True
    ) -> list[dict[str, Any]]:
        """Fetch owned games."""
        ...

    async def resolve_vanity_url(self, vanityurl: str) -> str | None:
        """Resolve a Steam vanity URL."""
        ...
