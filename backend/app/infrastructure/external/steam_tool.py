"""CrewAI tools for Steam Web API."""

from __future__ import annotations

import json

from crewai.tools import BaseTool
from pydantic import Field

from app.infrastructure.external.steam import get_owned_games, get_player_summaries


class SteamPlayerSummaryTool(BaseTool):
    """Tool to fetch a Steam player's summary and status."""

    name: str = "steam_player_summary"
    description: str = (
        "Fetch summary information for a Steam player, "
        "including their current status (online/offline), persona name, and last logoff time. "
        "Requires a 17-digit Steam64 ID."
    )

    steam_id: str = Field(..., description="The 17-digit Steam64 ID of the user.")

    async def _arun(self) -> str:
        """Async implementation of the tool."""
        try:
            summaries = await get_player_summaries([self.steam_id])
            if not summaries:
                return f"No player found for Steam ID: {self.steam_id}"

            summary = summaries[0]
            persona_name = summary.get("personaname", "Unknown")
            state_map = {
                0: "Offline",
                1: "Online",
                2: "Busy",
                3: "Away",
                4: "Snooze",
                5: "looking to trade",
                6: "looking to play",
            }
            state = state_map.get(summary.get("personastate", 0), "Unknown")

            result = {
                "persona_name": persona_name,
                "status": state,
                "profile_url": summary.get("profileurl", ""),
            }
            if "gameextrainfo" in summary:
                result["currently_playing"] = summary["gameextrainfo"]

            return json.dumps(result, indent=2)
        except Exception as e:
            return f"Error fetching player summary: {e!s}"


class SteamOwnedGamesTool(BaseTool):
    """Tool to fetch a Steam player's owned games."""

    name: str = "steam_owned_games"
    description: str = (
        "Fetch the list of games owned by a Steam user, including playtime. "
        "Requires a 17-digit Steam64 ID."
    )

    steam_id: str = Field(..., description="The 17-digit Steam64 ID of the user.")

    async def _arun(self) -> str:
        try:
            games = await get_owned_games(self.steam_id)
            if not games:
                return f"No games found or profile is private for Steam ID: {self.steam_id}"

            # Sort by playtime, returning top 10
            sorted_games = sorted(games, key=lambda x: x.get("playtime_forever", 0), reverse=True)
            top_games = sorted_games[:10]

            results = []
            for game in top_games:
                name = game.get("name", f"App {game.get('appid')}")
                playtime_hours = round(game.get("playtime_forever", 0) / 60, 1)
                results.append(f"{name} ({playtime_hours} hours)")

            total_games = len(games)
            return f"Total games owned: {total_games}. Top 10 most played:
" + "
".join(results)
        except Exception as e:
            return f"Error fetching owned games: {e!s}"
