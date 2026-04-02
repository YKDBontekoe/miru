from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.security.auth import CurrentUser
from app.domain.notifications.interfaces.notification_client import INotificationClient
from app.domain.notifications.schemas import NotificationRequest
from app.domain.notifications.use_cases.send_notification import SendNotificationUseCase
from app.infrastructure.notifications.azure_hubs import AzureNotificationHubClient

router = APIRouter(tags=["notifications"])


def get_notification_client() -> INotificationClient:
    """Dependency provider for notification client."""
    return AzureNotificationHubClient()


def get_send_notification_use_case(
    client: INotificationClient = Depends(get_notification_client),
) -> SendNotificationUseCase:
    """Dependency provider for the send notification use case."""
    return SendNotificationUseCase(notification_client=client)


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
    await use_case.execute(str(user_id), request.message, request.title)
    return {"status": "success"}
