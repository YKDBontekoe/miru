"""Integrations API router v1."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_resolve_steam_user_use_case
from app.api.v1.integrations_schemas import SteamUserResponse
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.integrations.use_cases.resolve_steam_user import (
    ResolveSteamUserUseCase,
    SteamUserNotFoundError,
)

router = APIRouter(tags=["Integrations"])


@router.get(
    "/steam/resolve-user",
    response_model=SteamUserResponse,
    summary="Resolve Steam user",
    description="Resolve a Steam username or ID and return the Steam64 ID and persona name. Requires authentication.",
    responses={
        200: {
            "description": "Steam user resolved successfully.",
            "content": {
                "application/json": {
                    "example": {"steam_id": "76561197960435530", "persona_name": "Robin"}
                }
            },
        },
        401: {"description": "Authentication required"},
        404: {"description": "Steam user not found"},
    },
)
async def resolve_steam_user(
    username: str,
    user_id: CurrentUser,
    use_case: Annotated[ResolveSteamUserUseCase, Depends(get_resolve_steam_user_use_case)],
) -> SteamUserResponse:
    """Resolve a Steam username or ID and return the Steam64 ID and persona name."""
    try:
        user_entity = await use_case.execute(username)
        return SteamUserResponse(
            steam_id=user_entity.steam_id, persona_name=user_entity.persona_name
        )
    except SteamUserNotFoundError as e:
        raise HTTPException(status_code=404, detail="Steam user not found") from e
