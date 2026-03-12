"""Steam Web API client."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

STEAM_API_BASE = "https://api.steampowered.com"


async def get_player_summaries(steam_ids: list[str]) -> list[dict[str, Any]]:
    """Fetch player summaries from Steam Web API."""
    settings = get_settings()
    if not settings.steam_api_key:
        logger.warning("Steam API key not configured")
        return []

    if not steam_ids:
        return []

    steam_ids_str = ",".join(steam_ids)
    url = f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/"
    params = {
        "key": settings.steam_api_key,
        "steamids": steam_ids_str,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return list(data.get("response", {}).get("players", []))
        except httpx.HTTPError:
            logger.exception("Failed to fetch Steam player summaries")
            return []
        except Exception:
            logger.exception("Unexpected error fetching Steam player summaries")
            return []


async def get_owned_games(
    steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True
) -> list[dict[str, Any]]:
    """Fetch owned games for a Steam user."""
    settings = get_settings()
    if not settings.steam_api_key:
        logger.warning("Steam API key not configured")
        return []

    url = f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/"
    params = {
        "key": settings.steam_api_key,
        "steamid": steam_id,
        "include_appinfo": "1" if include_appinfo else "0",
        "include_played_free_games": "1" if include_played_free_games else "0",
        "format": "json",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return list(data.get("response", {}).get("games", []))
        except httpx.HTTPError:
            logger.exception("Failed to fetch Steam owned games")
            return []
        except Exception:
            logger.exception("Unexpected error fetching Steam owned games")
            return []
