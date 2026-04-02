from __future__ import annotations

from pydantic import BaseModel


class NotificationRequest(BaseModel):
    """Request model for sending a notification.

    Attributes:
        message (str): The body of the notification message.
        title (str): The title of the notification. Defaults to 'New Notification'.
    """

    message: str
    title: str = "New Notification"
