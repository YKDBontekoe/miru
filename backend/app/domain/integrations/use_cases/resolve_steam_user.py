"""Use case for resolving a Steam user."""

from __future__ import annotations

from app.domain.integrations.entities import SteamUser
from app.domain.integrations.interfaces.steam_client import SteamClient


class ResolveSteamUserUseCase:
    """Use case to resolve a Steam username or ID."""

    def __init__(self, steam_client: SteamClient) -> None:
        self.steam_client = steam_client

    async def execute(self, username: str) -> SteamUser | None:
        """Resolve a Steam username or ID and return the SteamUser.

        Args:
            username: A 17-digit Steam64 ID or a Steam vanity URL username.

        Returns:
            SteamUser if found, else None.
        """
        steam_id = None

        # Check if it's already a 17-digit numeric string
        if username.isdigit() and len(username) == 17:
            steam_id = username
        else:
            steam_id = await self.steam_client.resolve_vanity_url(username)

        if not steam_id:
            return None

        # Get the persona name to confirm and return to UI
        summaries = await self.steam_client.get_player_summaries([steam_id])
        persona_name = "Unknown"
        if summaries:
            persona_name = summaries[0].get("personaname", "Unknown")

        return SteamUser(steam_id=steam_id, persona_name=persona_name)
