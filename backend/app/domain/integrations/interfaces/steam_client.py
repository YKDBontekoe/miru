from __future__ import annotations

from typing import Any, Protocol


class ISteamClient(Protocol):
    """Interface for Steam API client operations."""

    async def get_player_summaries(self, steam_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch player summaries.

        Args:
            steam_ids (list[str]): List of Steam64 IDs to fetch summaries for.

        Returns:
            list[dict[str, Any]]: List of player summary dictionaries.
        """
        ...

    async def get_owned_games(
        self, steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True
    ) -> list[dict[str, Any]]:
        """Fetch owned games for a user.

        Args:
            steam_id (str): Steam64 ID of the user.
            include_appinfo (bool): Whether to include application information.
            include_played_free_games (bool): Whether to include free games played.

        Returns:
            list[dict[str, Any]]: List of owned game dictionaries.
        """
        ...

    async def resolve_vanity_url(self, vanityurl: str) -> str | None:
        """Resolve a vanity URL to a Steam64 ID.

        Args:
            vanityurl (str): The vanity URL to resolve.

        Returns:
            str | None: The resolved Steam64 ID or None if not found.
        """
        ...
