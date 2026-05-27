"""Resolve Steam User Use Case."""

from __future__ import annotations

import logging

from app.domain.integrations.interfaces import SteamClientInterface

logger = logging.getLogger(__name__)


class ResolveSteamUserUseCase:
    """Use case to resolve a Steam user by username or ID."""

    def __init__(self, steam_client: SteamClientInterface):
        self.steam_client = steam_client

    async def execute(self, username: str) -> dict[str, str]:
        """Resolve a Steam username or ID and return the Steam64 ID and persona name."""
        steam_id = None

        # Check if it's already a 17-digit numeric string
        if username.isdigit() and len(username) == 17:
            steam_id = username
        else:
            steam_id = await self.steam_client.resolve_vanity_url(username)

        if not steam_id:
            raise ValueError("Steam user not found")

        # Get the persona name to confirm and return to UI
        summaries = await self.steam_client.get_player_summaries([steam_id])
        persona_name = "Unknown"
        if summaries:
            persona_name = summaries[0].get("personaname", "Unknown")

        return {"steam_id": steam_id, "persona_name": persona_name}
