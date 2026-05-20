"""Steam Client interface."""

from __future__ import annotations

from typing import Any, Protocol


class SteamClient(Protocol):
    """Abstract interface for Steam API interactions."""

    async def get_player_summaries(self, steam_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch player summaries from Steam Web API."""
        ...

    async def get_owned_games(
        self, steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True
    ) -> list[dict[str, Any]]:
        """Fetch owned games for a Steam user."""
        ...

    async def resolve_vanity_url(self, vanityurl: str) -> str | None:
        """Resolve a Steam vanity URL to a 64-bit Steam ID."""
        ...
