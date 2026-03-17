import json
import logging
from typing import Any

from notificationhubs_rest_python.NotificationHub import AzureNotification, AzureNotificationHub

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AzureNotificationHubClient:
    """Client wrapper for Azure Notification Hubs REST API."""

    def __init__(self) -> None:
        settings = get_settings()
        self.hub_name = settings.azure_notification_hub_name
        self.connection_string = settings.azure_notification_hub_connection_string

        if self.hub_name and self.connection_string:
            self.hub = AzureNotificationHub(self.connection_string, self.hub_name)
        else:
            self.hub = None
            logger.warning(
                "Azure Notification Hub settings are not configured. Notifications will not be sent."
            )

    async def send_notification(
        self, payload: str | dict[str, Any], tags: list[str] | None = None
    ) -> None:
        """
        Sends a notification via Azure Notification Hub.
        For simplicity, sends a template notification. Real usage may involve platform-specific payloads.
        """
        if not self.hub:
            logger.warning("Notification Hub is not initialized. Skipping notification.")
            return

        try:
            # Note: the notificationhubs-rest-python client is synchronous.
            # In a heavy async environment, this should be offloaded to a thread pool,
            # but for this basic implementation we call it directly.
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            notification = AzureNotification(notification_format="template", payload=payload)
            self.hub.send_notification(notification, tags)
            logger.info("Successfully sent notification.")
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            raise
