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
    PreferencesUpdateRequest,
    Profile,
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
    # Placeholder for actual WebAuthn logic
    return {"challenge": "dummy_challenge", "rp": {"name": "Miru", "id": "localhost"}}


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
    deleted = await service.delete_passkey(passkey_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Passkey not found")
    return {"status": "ok"}


@router.delete("/account")
async def delete_account(
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Delete a user account entirely."""
    await service.delete_account(user_id)
    return {"status": "ok"}


@router.patch("/account/preferences")
async def update_preferences(
    data: PreferencesUpdateRequest,
    user_id: CurrentUser,
) -> dict[str, Any]:
    """Update user consent preferences."""
    profile = await Profile.get_or_none(id=user_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"error": "profile_not_found", "message": "Profile not found"}
        )

    if data.marketing_consent is not None:
        profile.marketing_consent = data.marketing_consent
    if data.data_processing_consent is not None:
        profile.data_processing_consent = data.data_processing_consent

    await profile.save()
    return {"status": "ok"}
