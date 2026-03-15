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


@router.post("/passkey/register/options")
async def get_registration_options(
    data: PasskeyRegisterOptionsRequest,
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Get options for passkey registration (real WebAuthn challenge)."""
    try:
        from app.infrastructure.database.supabase import get_supabase_client
        client = get_supabase_client()
        user_resp = client.auth.admin.get_user_by_id(str(user_id))
        username = (user_resp.user.email or str(user_id)) if user_resp and user_resp.user else str(user_id)
    except Exception:
        username = str(user_id)

    return await service.get_registration_options(
        user_id=user_id,
        username=username,
        device_name=data.device_name,
    )


@router.post("/passkey/register/verify")
async def verify_registration(
    data: PasskeyRegisterVerifyRequest,
    user_id: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Verify passkey registration."""
    try:
        await service.verify_registration(
            challenge_id=data.challenge_id,
            credential_json=data.credential,
            user_id=user_id,
            device_name=data.device_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok"}


@router.post("/passkey/login/options")
async def get_login_options(
    data: PasskeyLoginOptionsRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Get options for passkey login (real WebAuthn challenge)."""
    return await service.get_login_options(email=data.email)


@router.post("/passkey/login/verify")
async def verify_login(
    data: PasskeyLoginVerifyRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, Any]:
    """Verify passkey login assertion and return tokens."""
    try:
        return await service.verify_login(
            challenge_id=data.challenge_id,
            credential_json=data.credential,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Authentication failed") from exc


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
