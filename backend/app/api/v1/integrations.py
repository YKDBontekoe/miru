"""Integrations API router v1."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.infrastructure.external.steam import get_player_summaries, resolve_vanity_url

router = APIRouter(tags=["Integrations"])


@router.get(
    "/steam/resolve-user",
    response_model=dict[str, str],
    responses={
        200: {"description": "Successfully resolved Steam user"},
        404: {"description": "Steam user not found"},
    },
)
async def resolve_steam_user(
    username: str,
    user_id: CurrentUser,
) -> dict[str, str]:
    """Resolve a Steam username or ID and return the Steam64 ID and persona name."""
    steam_id = None

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
