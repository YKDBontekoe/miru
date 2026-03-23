from __future__ import annotations

import logging
from uuid import UUID

from fastapi import Depends

from app.infrastructure.notifications.azure_hubs import AzureNotificationHubClient
from app.infrastructure.repositories.notification_repo import NotificationRepository

logger = logging.getLogger(__name__)


def sanitize_user_id(user_id: str | UUID) -> str:
    """Helper method to sanitize user ID before logging."""
    return str(user_id).replace("\n", "").replace("\r", "")[:256]


class NotificationService:
    """Service for managing and sending notifications.

    This service coordinates notification operations via Azure Notification Hubs.

    Attributes:
        azure_hub_client (AzureNotificationHubClient): Client used to send notifications.
        notification_repo (NotificationRepository): Repo for accessing device tokens.
    """

    def __init__(
        self,
        azure_hub_client: AzureNotificationHubClient = Depends(AzureNotificationHubClient),
        notification_repo: NotificationRepository = Depends(NotificationRepository),
    ) -> None:
        self.azure_hub_client = azure_hub_client
        self.notification_repo = notification_repo

    async def notify_user(
        self,
        user_id: UUID,
        title: str,
        message: str,
        data: dict | None = None,
    ) -> None:
        """
        Send a notification to all devices registered for a specific user.
        """
        if not user_id:
            raise ValueError("user_id cannot be empty")

        safe_user_id = sanitize_user_id(user_id)
        logger.info(f"Preparing to send notification to user {safe_user_id}")

        tokens = await self.notification_repo.list_user_tokens(user_id)
        if not tokens:
            logger.info(f"No device tokens found for user {safe_user_id}")
            return

        for token_record in tokens:
            try:
                await self.azure_hub_client.send_native_notification(
                    token=token_record.token,
                    platform=token_record.platform,
                    title=title,
                    message=message,
                    data=data,
                )
            except Exception as e:
                logger.error(
                    f"Failed to send push notification to token {token_record.token} "
                    f"on platform {token_record.platform} for user {safe_user_id}: {e!s}"
                )
