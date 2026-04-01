from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from app.domain.notifications.services import NotificationService
from app.infrastructure.notifications.azure_hubs import \
    AzureNotificationHubClient


@pytest.fixture
def mock_azure_client() -> AsyncMock:
    client = AsyncMock(spec=AzureNotificationHubClient)
    client.send_notification = AsyncMock()
    return client


@pytest.fixture
def notification_service(mock_azure_client: AsyncMock) -> NotificationService:
    return NotificationService(azure_hub_client=mock_azure_client)


@pytest.mark.asyncio
async def test_notify_user(
    notification_service: NotificationService, mock_azure_client: AsyncMock
) -> None:
    await notification_service.notify_user("user_123", "Test message", "Test Title")

    mock_azure_client.send_notification.assert_awaited_once_with(
        {"message": "Test message", "title": "Test Title"}, ["user:user_123"]
    )


@pytest.mark.asyncio
async def test_notify_user_propagates_exception(
    notification_service: NotificationService, mock_azure_client: AsyncMock
) -> None:
    mock_azure_client.send_notification.side_effect = Exception("Hub unavailable")

    with pytest.raises(Exception, match="Hub unavailable"):
        await notification_service.notify_user("user_123", "Test message", "Test Title")


@pytest.mark.asyncio
async def test_notify_user_empty_user_id(
    notification_service: NotificationService, mock_azure_client: AsyncMock
) -> None:
    with pytest.raises(ValueError, match="user_id cannot be empty"):
        await notification_service.notify_user("", "Test message", "Test Title")

    mock_azure_client.send_notification.assert_not_called()


@pytest.mark.asyncio
async def test_notify_user_default_title(
    notification_service: NotificationService, mock_azure_client: AsyncMock
) -> None:
    await notification_service.notify_user("user_456", "Default title message")

    mock_azure_client.send_notification.assert_awaited_once_with(
        {"message": "Default title message", "title": "New Notification"}, ["user:user_456"]
    )
