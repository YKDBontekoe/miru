"""Auth API router v1."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_auth_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.auth.models import (
    PasskeyLoginOptionsRequest,
    PasskeyLoginVerifyRequest,
    PasskeyRecord,
    PasskeyRegisterOptionsRequest,
    PasskeyRegisterVerifyRequest,
)
from app.domain.auth.service import AuthService  # noqa: TCH001

router = APIRouter(tags=["Auth"])


@router.post(
    "/passkey/register/options",
    summary="Get registration options",
    description="Get options for passkey registration. Requires authentication.",
    responses={
        200: {"description": "Registration options retrieved successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def get_registration_options(
    _data: PasskeyRegisterOptionsRequest,
    _user_id: CurrentUser,
    _service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Get options for passkey registration."""
    # Placeholder for actual WebAuthn logic
    return {"challenge": "dummy_challenge", "rp": {"name": "Miru", "id": "localhost"}}


@router.post(
    "/passkey/register/verify",
    summary="Verify registration",
    description="Verify passkey registration. Requires authentication.",
    responses={
        200: {"description": "Passkey registration verified successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def verify_registration(
    data: PasskeyRegisterVerifyRequest,
    _user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Verify passkey registration."""
    await service.verify_registration(data.challenge_id, data.credential)
    return {"status": "ok"}


@router.post(
    "/passkey/login/options",
    summary="Get login options",
    description="Get options for passkey login. Does not require authentication.",
    responses={
        200: {"description": "Login options retrieved successfully."},
        422: {"description": "Validation Error"},
    },
)
async def get_login_options(
    _data: PasskeyLoginOptionsRequest,
    _service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Get options for passkey login."""
    return {"challenge": "dummy_challenge"}


@router.post(
    "/passkey/login/verify",
    summary="Verify login",
    description="Verify passkey login and return tokens. Does not require authentication.",
    responses={
        200: {"description": "Login verified successfully. Returns tokens."},
        422: {"description": "Validation Error"},
    },
)
async def verify_login(
    _data: PasskeyLoginVerifyRequest,
    _service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Verify passkey login and return tokens."""
    return {
        "access_token": "dummy_access_token",
        "refresh_token": "dummy_refresh_token",
    }


@router.get(
    "/passkey/list",
    response_model=dict[str, list[PasskeyRecord]],
    summary="List passkeys",
    description="List all passkeys for the current user. Requires authentication.",
    responses={
        200: {"description": "Passkeys retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_passkeys(
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, list[PasskeyRecord]]:
    """List all passkeys for the current user."""
    passkeys = await service.repo.get_passkeys_by_user(user_id)
    return {"passkeys": passkeys}


@router.delete(
    "/passkey/{passkey_id}",
    summary="Delete passkey",
    description="Delete a passkey. Requires authentication.",
    responses={
        200: {"description": "Passkey deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Passkey not found"},
        422: {"description": "Validation Error"},
    },
)
async def delete_passkey(
    passkey_id: str,
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Delete a passkey."""
    deleted = await service.delete_passkey(passkey_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Passkey not found")
    return {"status": "ok"}
