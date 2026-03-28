"""Discord Web API client."""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

DISCORD_API_BASE = "https://discord.com/api/v10"


async def _get_async(
    url: str, headers: dict[str, str], params: dict[str, Any] | None = None
) -> Any:
    """Asynchronous GET with httpx; returns parsed JSON or raises."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        return resp.json()


async def _post_async(url: str, headers: dict[str, str], json_data: dict[str, Any]) -> Any:
    """Asynchronous POST with httpx; returns parsed JSON or raises."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=headers, json=json_data)
        resp.raise_for_status()
        return resp.json()


async def get_server_info(bot_token: str, guild_id: str) -> dict[str, Any] | None:
    """Fetch basic information about a Discord server (guild)."""
    url = f"{DISCORD_API_BASE}/guilds/{guild_id}?with_counts=true"
    headers = {
        "Authorization": f"Bot {bot_token}",
    }

    try:
        data = await _get_async(url, headers)
        if not data:
            return None

        return {
            "name": data.get("name"),
            "description": data.get("description"),
            "member_count": data.get("approximate_member_count"),
            "id": data.get("id"),
            "icon_url": f"https://cdn.discordapp.com/icons/{guild_id}/{data.get('icon')}.png"
            if data.get("icon")
            else None,
        }
    except httpx.HTTPStatusError as e:
        logger.exception(f"Discord API returned error status: {e.response.status_code}")
        return None
    except httpx.RequestError:
        logger.exception("Failed to fetch Discord server info")
        return None
    except Exception:
        logger.exception("Unexpected error fetching Discord server info")
        return None


async def send_message(bot_token: str, channel_id: str, content: str) -> bool:
    """Send a text message to a specific Discord channel."""
    url = f"{DISCORD_API_BASE}/channels/{channel_id}/messages"
    headers = {"Authorization": f"Bot {bot_token}", "Content-Type": "application/json"}
    json_data = {"content": content}

    try:
        await _post_async(url, headers, json_data)
        return True
    except httpx.HTTPStatusError as e:
        logger.exception(f"Discord API returned error status: {e.response.status_code}")
        return False
    except httpx.RequestError:
        logger.exception("Failed to send Discord message")
        return False
    except Exception:
        logger.exception("Unexpected error sending Discord message")
        return False
