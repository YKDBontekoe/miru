from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.core.security.auth import CurrentUser
from app.domain.notifications.services import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationRequest(BaseModel):
    message: str
    title: str = "New Notification"


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_notification(
    request: NotificationRequest,
    user_id: CurrentUser,
    service: NotificationService = Depends(NotificationService),
) -> dict[str, str]:
    """
    Test endpoint to send a notification to the current user.
    """
    await service.notify_user(str(user_id), request.message, request.title)
    return {"status": "success"}
