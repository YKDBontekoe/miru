from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_send_notification_use_case
from app.core.security.auth import CurrentUser
from app.domain.notifications.schemas import NotificationRequest
from app.domain.notifications.use_cases.send_notification import SendNotificationUseCase

router = APIRouter(tags=["notifications"])





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
    use_case: SendNotificationUseCase = Depends(get_send_notification_use_case),
) -> dict[str, str]:
    """
    Test endpoint to send a notification to the current user.
    The request is accepted for asynchronous processing.

    Args:
        request (NotificationRequest): The HTTP request body containing message payload.
        user_id (CurrentUser): String identifier of the current authenticated user.
        use_case (SendNotificationUseCase): The send notification use case.

    Returns:
        dict[str, str]: A dictionary indicating the async job has successfully started.
    """
    try:
        await use_case.execute(str(user_id), request.message, request.title)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_user_id", "message": str(e)},
        ) from e
    return {"status": "success"}
