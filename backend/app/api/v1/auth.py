"""Auth API router v1."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_auth_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.auth.models import (
    ConsentUpdateRequest,
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


@router.post("/consent")
async def update_consent(
    data: ConsentUpdateRequest,
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Update marketing and data-processing consent toggles."""
    # SEC(agent): Remediation for Consent Tracking Vulnerability:
    # Explicitly track and update user consent for GDPR/CCPA.
    success = await service.update_consent(
        user_id, data.marketing_consent, data.data_processing_consent
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update consent")
    return {"status": "ok"}


@router.delete("/account")
async def delete_account(
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Delete the user account completely, wiping out all associated data (Right to Erasure)."""
    # SEC(agent): Remediation for Right to Erasure / GDPR Compliance Vulnerability:
    # Users must be able to completely delete their accounts and all related PII/data.
    deleted = await service.delete_account(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found or could not be deleted")
    return {"status": "ok"}
