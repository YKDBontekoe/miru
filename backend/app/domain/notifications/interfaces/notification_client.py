from __future__ import annotations

from typing import Any, Protocol


class INotificationClient(Protocol):
    """Protocol for sending notifications."""

    async def send_notification(
        self, payload: str | dict[str, Any], tags: list[str] | None = None
    ) -> None:
        """Send a notification.

        Args:
            payload: The payload of the notification.
            tags: List of tags to route messages to specific users.
        """
        ...
