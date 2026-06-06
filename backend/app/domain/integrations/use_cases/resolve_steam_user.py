from __future__ import annotations

from app.domain.integrations.interfaces.steam_client import ISteamClient


class ResolveSteamUserUseCase:
    def __init__(self, steam_client: ISteamClient) -> None:
        self.steam_client = steam_client

    async def execute(self, username: str) -> dict[str, str]:
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
