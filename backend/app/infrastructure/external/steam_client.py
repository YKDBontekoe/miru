from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings
from app.domain.integrations.interfaces.steam_client import ISteamClient

logger = logging.getLogger(__name__)

STEAM_API_BASE = "https://api.steampowered.com"


class SteamClient(ISteamClient):
    async def _get_async(self, url: str, params: dict[str, str]) -> Any:
        """Asynchronous GET with httpx; returns parsed JSON or raises."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_player_summaries(self, steam_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch player summaries from Steam Web API.

        Args:
            steam_ids (list[str]): List of Steam64 IDs to fetch summaries for.

        Returns:
            list[dict[str, Any]]: List of player summary dictionaries.
        """
        settings = get_settings()
        if not settings.steam_api_key:
            logger.warning("Steam API key not configured")
            return []

        if not steam_ids:
            return []

        url = f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/"
        params = {
            "key": settings.steam_api_key,
            "steamids": ",".join(steam_ids),
        }

        try:
            data = await self._get_async(url, params)
            return data.get("response", {}).get("players", [])
        except httpx.HTTPStatusError:
            logger.exception("Steam API returned error status for player summaries")
            return []
        except httpx.RequestError:
            logger.exception("Failed to fetch Steam player summaries")
            return []
        except Exception:
            logger.exception("Unexpected error fetching Steam player summaries")
            return []

    async def get_owned_games(
        self, steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True
    ) -> list[dict[str, Any]]:
        """Fetch owned games for a Steam user.

        Args:
            steam_id (str): Steam64 ID of the user.
            include_appinfo (bool): Whether to include application information. Default True.
            include_played_free_games (bool): Whether to include free games played. Default True.

        Returns:
            list[dict[str, Any]]: List of owned game dictionaries.
        """
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

        try:
            data = await self._get_async(url, params)
            return data.get("response", {}).get("games", [])
        except httpx.HTTPStatusError:
            logger.exception("Steam API returned error status for owned games")
            return []
        except httpx.RequestError:
            logger.exception("Failed to fetch Steam owned games")
            return []
        except Exception:
            logger.exception("Unexpected error fetching Steam owned games")
            return []

    async def resolve_vanity_url(self, vanityurl: str) -> str | None:
        """Resolve a Steam vanity URL to a 64-bit Steam ID.

        Args:
            vanityurl (str): The vanity URL to resolve.

        Returns:
            str | None: A 64-bit Steam ID as a str or None if resolution fails.
        """
        settings = get_settings()
        if not settings.steam_api_key:
            logger.warning("Steam API key not configured")
            return None

        url = f"{STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/"
        params = {
            "key": settings.steam_api_key,
            "vanityurl": vanityurl,
        }

        try:
            data = await self._get_async(url, params)
            if data.get("response", {}).get("success") == 1:
                return str(data["response"]["steamid"])
            return None
        except httpx.HTTPStatusError:
            logger.exception("Steam API returned error status for resolving vanity URL")
            return None
        except httpx.RequestError:
            logger.exception("Failed to resolve Steam vanity URL")
            return None
        except Exception:
            logger.exception("Error resolving Steam vanity URL")
            return None
