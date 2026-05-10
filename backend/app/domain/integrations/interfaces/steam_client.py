"""Steam client interface for the integrations domain."""

from __future__ import annotations

from typing import Any, Protocol


class ISteamClient(Protocol):
    """Protocol defining operations for the Steam external service."""

    async def get_player_summaries(self, steam_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch player summaries from Steam Web API.

        Args:
            steam_ids: List of Steam64 IDs to fetch summaries for.

        Returns:
            list[dict[str, Any]]: List of player summaries.
        """
        ...

    async def resolve_vanity_url(self, vanityurl: str) -> str | None:
        """Resolve a Steam vanity URL to a 64-bit Steam ID.

        Args:
            vanityurl: The custom URL identifier.

        Returns:
            str | None: The 64-bit Steam ID if found, else None.
        """
        ...

    async def get_owned_games(
        self, steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True
    ) -> list[dict[str, Any]]:
        """Fetch owned games for a Steam user.

        Args:
            steam_id: The Steam64 ID of the user.
            include_appinfo: Whether to include game name and logo.
            include_played_free_games: Whether to include free games played.

        Returns:
            list[dict[str, Any]]: List of owned games.
        """
        ...
