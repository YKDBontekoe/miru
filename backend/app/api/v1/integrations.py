"""Integrations API router v1."""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException

from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.infrastructure.external.steam import get_player_summaries, resolve_vanity_url

router = APIRouter(tags=["Integrations"])


@router.get("/steam/resolve-user")
async def resolve_steam_user(
    username: str,
    user_id: CurrentUser,
) -> dict[str, str]:
    """Resolve a Steam username or ID and return the Steam64 ID and persona name."""
    steam_id = None

    # Parse username from full URL if provided
    username = username.strip().rstrip("/")
    profiles_match = re.search(r"steamcommunity\.com/profiles/(\d+)", username)
    id_match = re.search(r"steamcommunity\.com/id/([^/]+)", username)

    if profiles_match:
        username = profiles_match.group(1)
    elif id_match:
        username = id_match.group(1)

    # Check if it's already a 17-digit numeric string
    if username.isdigit() and len(username) == 17:
        steam_id = username
    else:
        steam_id = await resolve_vanity_url(username)

    if not steam_id:
        raise HTTPException(status_code=404, detail="Steam user not found")

    # Get the persona name to confirm and return to UI
    summaries = await get_player_summaries([steam_id])
    persona_name = "Unknown"
    if summaries:
        persona_name = summaries[0].get("personaname", "Unknown")

    return {"steam_id": steam_id, "persona_name": persona_name}
