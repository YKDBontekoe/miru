"""Integrations API router v1."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.integrations.interfaces.steam_client import ISteamClient
from app.domain.integrations.use_cases.resolve_steam_user import ResolveSteamUserUseCase
from app.infrastructure.external.steam_client import SteamClient

router = APIRouter(tags=["Integrations"])


def get_steam_client() -> ISteamClient:
    """Dependency provider for the Steam client.

    Returns:
        ISteamClient: A concrete implementation of the Steam client.
    """
    return SteamClient()


def get_resolve_steam_user_use_case(
    steam_client: ISteamClient = Depends(get_steam_client),
) -> ResolveSteamUserUseCase:
    """Dependency provider for the resolve Steam user use case.

    Args:
        steam_client (ISteamClient): The Steam client obtained via Depends.

    Returns:
        ResolveSteamUserUseCase: An instance of the use case configured with the client.
    """
    return ResolveSteamUserUseCase(steam_client)


@router.get(
    "/steam/resolve-user",
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
    use_case: ResolveSteamUserUseCase = Depends(get_resolve_steam_user_use_case),
) -> dict[str, str]:
    """Resolve a Steam username or ID and return the Steam64 ID and persona name."""
    try:
        return await use_case.execute(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
