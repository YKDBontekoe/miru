from __future__ import annotations

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.core.security.auth import CurrentUser
from app.domain.notifications.services import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationRequest(BaseModel):
    """Request model for sending a notification.

    Attributes:
        message (str): The body of the notification message.
        title (str): The title of the notification. Defaults to 'New Notification'.
    """

    message: str
    title: str = "New Notification"


@router.post("/send", status_code=status.HTTP_202_ACCEPTED)
async def send_notification(
    request: NotificationRequest,
    user_id: CurrentUser,
    service: NotificationService = Depends(NotificationService),
) -> dict[str, str]:
    """
    Test endpoint to send a notification to the current user.
    The request is accepted for asynchronous processing.
    """
    await service.notify_user(str(user_id), request.message, request.title)
    return {"status": "success"}
