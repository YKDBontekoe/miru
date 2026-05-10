"""Use case for resolving a Steam user."""

from __future__ import annotations

from app.domain.integrations.entities import SteamUserEntity
from app.domain.integrations.interfaces.steam_client import ISteamClient


class SteamUserNotFoundError(Exception):
    """Raised when a Steam user cannot be resolved or found."""

    pass


class ResolveSteamUserUseCase:
    """Use case to resolve a Steam username or vanity URL into a Steam ID and persona name."""

    def __init__(self, steam_client: ISteamClient):
        self._steam_client = steam_client

    async def execute(self, username: str) -> SteamUserEntity:
        """Resolve a Steam username or ID.

        Args:
            username: The Steam vanity URL or 17-digit numeric string.

        Returns:
            SteamUserEntity: The resolved user entity.

        Raises:
            SteamUserNotFoundError: If the user cannot be found or resolved.
        """
        steam_id = None

        # Check if it's already a 17-digit numeric string
        if username.isdigit() and len(username) == 17:
            steam_id = username
        else:
            steam_id = await self._steam_client.resolve_vanity_url(username)

        if not steam_id:
            raise SteamUserNotFoundError("Steam user not found")

        # Get the persona name to confirm and return to UI
        summaries = await self._steam_client.get_player_summaries([steam_id])
        persona_name = "Unknown"
        if summaries:
            persona_name = summaries[0].get("personaname", "Unknown")

        return SteamUserEntity(steam_id=steam_id, persona_name=persona_name)
