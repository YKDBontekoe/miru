from __future__ import annotations

from app.domain.integrations.interfaces.steam_client import ISteamClient


class ResolveSteamUserUseCase:
    """Use case to resolve a Steam username to a Steam64 ID and persona name.

    Attributes:
        steam_client (ISteamClient): The Steam client interface.
    """

    def __init__(self, steam_client: ISteamClient) -> None:
        """Initialize the use case.

        Args:
            steam_client (ISteamClient): The Steam client to use.
        """
        self.steam_client = steam_client

    async def execute(self, username: str) -> dict[str, str]:
        """Execute the use case to resolve a Steam user.

        Accepts a 17-digit SteamID or vanity name and resolves via steam_client.

        Args:
            username (str): The username or 17-digit Steam ID.

        Returns:
            dict[str, str]: A dictionary with keys 'steam_id' and 'persona_name'.

        Raises:
            ValueError: If the Steam user is not found.
        """
        steam_id = None

        if username.isdigit() and len(username) == 17:
            steam_id = username
        else:
            steam_id = await self.steam_client.resolve_vanity_url(username)

        if not steam_id:
            raise ValueError("Steam user not found")

        summaries = await self.steam_client.get_player_summaries([steam_id])
        persona_name = "Unknown"
        if summaries:
            persona_name = summaries[0].get("personaname", "Unknown")

        return {"steam_id": steam_id, "persona_name": persona_name}
