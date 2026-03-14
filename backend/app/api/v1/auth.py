"""Auth API router v1."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_auth_service
from app.core.config import get_settings
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


@router.post("/passkey/register/options")
async def get_registration_options(
    _data: PasskeyRegisterOptionsRequest,
    _user_id: CurrentUser,
    _service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Get options for passkey registration."""
    settings = get_settings()
    # Placeholder for actual WebAuthn logic
    return {
        "challenge": "dummy_challenge",
        "rp": {"name": settings.webauthn_rp_name, "id": settings.webauthn_rp_id},
    }


@router.post("/passkey/register/verify")
async def verify_registration(
    data: PasskeyRegisterVerifyRequest,
    _user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Verify passkey registration."""
    await service.verify_registration(data.challenge_id, data.credential)
    return {"status": "ok"}


@router.post("/passkey/login/options")
async def get_login_options(
    _data: PasskeyLoginOptionsRequest,
    _service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Get options for passkey login."""
    return {"challenge": "dummy_challenge"}


@router.post("/passkey/login/verify")
async def verify_login(
    _data: PasskeyLoginVerifyRequest,
    _service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Verify passkey login and return tokens."""
    return {
        "access_token": "dummy_access_token",
        "refresh_token": "dummy_refresh_token",
    }


@router.get("/passkey/list", response_model=dict[str, list[PasskeyRecord]])
async def list_passkeys(
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, list[PasskeyRecord]]:
    """List all passkeys for the current user."""
    passkeys = await service.repo.get_passkeys_by_user(user_id)
    return {"passkeys": passkeys}


@router.delete("/passkey/{passkey_id}")
async def delete_passkey(
    passkey_id: str,
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Delete a passkey."""
    # Simple check if it belongs to user
    passkeys = await service.repo.get_passkeys_by_user(user_id)
    if not any(str(p.id) == passkey_id for p in passkeys):
        raise HTTPException(status_code=404, detail="Passkey not found")

    # Assuming we have a delete method in repo, or using raw supabase
    service.repo.db.table("passkeys").delete().eq("id", passkey_id).execute()
    return {"status": "ok"}
