"""Integrations domain use cases."""

from __future__ import annotations

from dataclasses import dataclass

from app.domain.integrations.interfaces import SteamClientInterface


@dataclass
class SteamUserDTO:
    """Data transfer object for a resolved Steam user."""

    steam_id: str
    persona_name: str


class ResolveSteamUserUseCase:
    """Use case to resolve a Steam user by username or vanity URL."""

    def __init__(self, steam_client: SteamClientInterface) -> None:
        self._steam_client = steam_client

    async def execute(self, username: str) -> SteamUserDTO | None:
        """Execute the use case to resolve the user.

        Args:
            username: The 17-digit numeric string or a vanity username.

        Returns:
            SteamUserDTO if found, None otherwise.
        """
        steam_id = None

        # Check if it's already a 17-digit numeric string
        if username.isdigit() and len(username) == 17:
            steam_id = username
        else:
            steam_id = await self._steam_client.resolve_vanity_url(username)

        if not steam_id:
            return None

        # Get the persona name to confirm and return to UI
        summaries = await self._steam_client.get_player_summaries([steam_id])
        persona_name = "Unknown"
        if summaries:
            persona_name = summaries[0].get("personaname", "Unknown")

        return SteamUserDTO(steam_id=steam_id, persona_name=persona_name)
