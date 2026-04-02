from __future__ import annotations

import logging

from app.domain.notifications.interfaces.notification_client import INotificationClient

logger = logging.getLogger(__name__)


def sanitize_user_id(user_id: str) -> str:
    """Sanitize user ID before logging.

    Args:
        user_id (str): The user ID, potentially containing newlines or CRs.

    Returns:
        str: The sanitized user ID with newlines/CRs removed and truncated to 256 chars.
    """
    return user_id.replace("\n", "").replace("\r", "")[:256]


class SendNotificationUseCase:
    """Use case for sending notifications.

    This use case orchestrates sending notifications using an abstract client interface.
    """

    def __init__(self, notification_client: INotificationClient) -> None:
        self.notification_client = notification_client

    async def execute(self, user_id: str, message: str, title: str = "New Notification") -> None:
        """
        Send a notification to a specific user.

        Args:
            user_id: The ID of the user to send the notification to.
            message: The content of the notification.
            title: The title of the notification.

        Raises:
            ValueError: If user_id is empty.
        """
        trimmed_user_id = user_id.strip()
        if not trimmed_user_id:
            raise ValueError("user_id cannot be empty")

        payload = {"message": message, "title": title}
        tags = [f"user:{trimmed_user_id}"]

        safe_user_id = sanitize_user_id(trimmed_user_id)
        logger.info(f"Sending notification to user {safe_user_id}")
        await self.notification_client.send_notification(payload, tags)
