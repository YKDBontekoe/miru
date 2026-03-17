import logging

from fastapi import Depends

from app.infrastructure.notifications.azure_hubs import AzureNotificationHubClient

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(
        self,
        azure_hub_client: AzureNotificationHubClient = Depends(AzureNotificationHubClient),
    ) -> None:
        self.azure_hub_client = azure_hub_client

    async def notify_user(self, user_id: str, message: str, title: str = "New Notification") -> None:
        """
        Send a generic template notification to a specific user.
        Tags can be used to route messages to specific user devices.
        """
        payload = {"message": message, "title": title}
        # In a real scenario, you'd format the payload based on the notification type
        # For this example, we assume template registration on the client that uses {"message": ..., "title": ...}

        # Tags are used to send notifications to specific user device registrations
        tags = [f"user:{user_id}"]

        # SEC(agent): Sanitized user input to prevent log injection (CWE-117)
        safe_user_id = user_id.replace('\n', '').replace('\r', '')
        logger.info(f"Sending notification to user {safe_user_id}")
        await self.azure_hub_client.send_notification(payload, tags)
