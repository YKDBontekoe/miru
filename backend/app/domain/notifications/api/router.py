"""API routes for notifications domain."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException

from app.core.security.auth import get_current_user
from app.domain.notifications.models import DeviceTokenCreate, DeviceTokenResponse
from app.infrastructure.repositories.notification_repo import NotificationRepository

if TYPE_CHECKING:
    from app.domain.auth.models import JWTPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_notification_repo() -> NotificationRepository:
    """Dependency provider for NotificationRepository."""
    return NotificationRepository()


@router.post("/device-tokens", response_model=DeviceTokenResponse)
async def register_device_token(
    payload: DeviceTokenCreate,
    current_user: JWTPayload = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repo),
) -> DeviceTokenResponse:
    """Register or update a push notification device token for the current user."""
    try:
        # SEC(agent): Relying on current_user.sub implicitly prevents IDOR
        token = await repo.add_or_update_device_token(
            user_id=current_user.sub,
            token=payload.token,
            platform=payload.platform,
        )
        return DeviceTokenResponse.model_validate(token)
    except Exception as exc:
        logger.exception("Failed to register device token")
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@router.delete("/device-tokens/{token}", status_code=204)
async def remove_device_token(
    token: str,
    current_user: JWTPayload = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repo),
) -> None:
    """Remove a push notification device token."""
    try:
        deleted = await repo.remove_device_token(user_id=current_user.sub, token=token)
        if not deleted:
            # Mask if token didn't exist or doesn't belong to the user
            raise HTTPException(status_code=404, detail="Token not found")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to remove device token")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
