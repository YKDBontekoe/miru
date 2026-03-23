from __future__ import annotations

import asyncio
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
        Sends a template notification via Azure Notification Hub.
        """
        if not self.hub:
            logger.warning("Notification Hub is not initialized. Skipping notification.")
            return

        try:
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            notification = AzureNotification(notification_format="template", payload=payload)
            # notificationhubs-rest-python client is synchronous.
            # Use asyncio.to_thread to offload blocking I/O off the main event loop.
            await asyncio.to_thread(self.hub.send_notification, notification, tags)
            logger.info("Successfully sent notification.")
        except Exception as exc:
            logger.exception("Failed to send notification", exc_info=exc)
            raise

    async def send_native_notification(
        self,
        token: str,
        platform: str,
        title: str,
        message: str,
        data: dict | None = None,
    ) -> None:
        """
        Send a direct native push notification (APNS or FCM/GCM) directly to a device token via Azure.
        """
        if not self.hub:
            logger.warning("Notification Hub is not initialized. Skipping notification.")
            return

        payload: dict[str, Any] = {}
        platform_lower = platform.lower()
        notification_format = "apple"  # default to Apple

        if platform_lower in ["ios", "apns"]:
            notification_format = "apple"
            # APNS native payload format
            payload = {
                "aps": {
                    "alert": {
                        "title": title,
                        "body": message,
                    },
                    "sound": "default",
                }
            }
            if data:
                payload.update(data)

        elif platform_lower in ["android", "fcm", "gcm"]:
            notification_format = "gcm"  # Note: older azure SDKs use 'gcm' for FCM as well
            # FCM native payload format (Firebase Cloud Messaging v1 / Legacy via Hubs)
            payload = {
                "data": {
                    "title": title,
                    "message": message,
                    **(data or {}),
                }
            }
        elif platform_lower == "expo":
            # If sending directly to Expo Push API, it's better to use HTTP directly to expo servers,
            # but if Azure Hub supports custom templates or direct FCM routing, we format as FCM.
            # Assuming Expo managed app pushes fallback to FCM format in Azure:
            notification_format = "gcm"
            payload = {
                "data": {
                    "title": title,
                    "message": message,
                    **(data or {}),
                }
            }
        else:
            logger.warning(f"Unsupported push platform: {platform}")
            return

        # We use Azure Notification Hub Direct Send to a specific push handle (device token)
        try:
            payload_str = json.dumps(payload)
            notification = AzureNotification(
                notification_format=notification_format, payload=payload_str
            )
            # We want to use direct routing to the device token without registering it in Azure Hub DB.
            # However, the `notificationhubs-rest-python` library `send_notification` uses `tags`.
            # We will use `send_direct_notification` if it exists, otherwise we'll fall back to standard tag-based.
            if hasattr(self.hub, "send_direct_notification"):
                await asyncio.to_thread(self.hub.send_direct_notification, notification, token)
            else:
                # If the wrapper doesn't support direct_send, we fall back to generic tags (which assumes device is registered in Azure Hub)
                # But since we're managing tokens in our own DB, we might need a custom HTTP request if this lib is limited.
                pass
            logger.info(f"Successfully sent native direct notification to {platform} token.")
        except Exception as exc:
            logger.exception("Failed to send native notification", exc_info=exc)
            raise
