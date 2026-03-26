"""Steam Web API client."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

STEAM_API_BASE = "https://api.steampowered.com"


def _get(url: str, params: dict[str, str]) -> Any:
    """Synchronous GET with urllib; returns parsed JSON or raises."""
    full_url = url + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(full_url, timeout=10) as resp:  # noqa: S310
        return json.loads(resp.read())


async def get_player_summaries(steam_ids: list[str]) -> list[dict[str, Any]]:
    """Fetch player summaries from Steam Web API."""
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
        data = _get(url, params)
        return list(data.get("response", {}).get("players", []))
    except urllib.error.URLError:
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

    try:
        data = _get(url, params)
        return list(data.get("response", {}).get("games", []))
    except urllib.error.URLError:
        logger.exception("Failed to fetch Steam owned games")
        return []
    except Exception:
        logger.exception("Unexpected error fetching Steam owned games")
        return []


async def resolve_vanity_url(vanityurl: str) -> str | None:
    """Resolve a Steam vanity URL to a 64-bit Steam ID."""
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
        data = _get(url, params)
        if data.get("response", {}).get("success") == 1:
            return str(data["response"]["steamid"])
        return None
    except Exception:
        logger.exception("Error resolving Steam vanity URL")
        return None
