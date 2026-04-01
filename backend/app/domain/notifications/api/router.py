from __future__ import annotations

from app.core.security.auth import CurrentUser
from app.domain.notifications.services import NotificationService
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

router = APIRouter(tags=["notifications"])


class NotificationRequest(BaseModel):
    """Request model for sending a notification.

    Attributes:
        message (str): The body of the notification message.
        title (str): The title of the notification. Defaults to 'New Notification'.
    """

    message: str
    title: str = "New Notification"


@router.post(
    "/send",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Send notification",
    description="Test endpoint to send a notification to the current user. Requires authentication.",
    responses={
        202: {"description": "Notification sent successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def send_notification(
    request: NotificationRequest,
    user_id: CurrentUser,
    service: NotificationService = Depends(NotificationService),
) -> dict[str, str]:
    """
    Test endpoint to send a notification to the current user.
    The request is accepted for asynchronous processing.

    Args:
        request (NotificationRequest): The HTTP request body containing message payload.
        user_id (CurrentUser): String identifier of the current authenticated user.
        service (NotificationService): The notification service dependency instance.

    Returns:
        dict[str, str]: A dictionary indicating the async job has successfully started.
    """
    await service.notify_user(str(user_id), request.message, request.title)
    return {"status": "success"}
