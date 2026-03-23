"""Repository for managing device tokens."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.domain.notifications.models import DeviceToken

if TYPE_CHECKING:
    from collections.abc import Sequence
    from uuid import UUID

logger = logging.getLogger(__name__)


class NotificationRepository:
    """Repository for device tokens and notification preferences."""

    async def add_or_update_device_token(
        self, user_id: UUID, token: str, platform: str
    ) -> DeviceToken:
        """Register or update a user's device token."""
        # Attempt to find the token
        existing = await DeviceToken.get_or_none(token=token)

        if existing:
            # If the token exists but is linked to another user (or platform changed), update it
            if existing.user_id != user_id or existing.platform != platform:
                existing.user_id = user_id
                existing.platform = platform
                await existing.save(update_fields=["user_id", "platform", "updated_at"])
            return existing

        # If token doesn't exist, create it
        new_token = await DeviceToken.create(user_id=user_id, token=token, platform=platform)
        return new_token

    async def remove_device_token(self, user_id: UUID, token: str) -> bool:
        """Remove a user's device token (e.g., on logout or revocation)."""
        deleted_count = await DeviceToken.filter(user_id=user_id, token=token).delete()
        return deleted_count > 0

    async def list_user_tokens(self, user_id: UUID) -> Sequence[DeviceToken]:
        """List all registered device tokens for a user."""
        return await DeviceToken.filter(user_id=user_id).all()
