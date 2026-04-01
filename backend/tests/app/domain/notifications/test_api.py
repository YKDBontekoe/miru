from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from app.core.security.auth import get_current_user
from app.domain.notifications.services import NotificationService
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_send_notification_endpoint() -> None:
    mock_service = MagicMock(spec=NotificationService)
    mock_service.notify_user = AsyncMock()

    app.dependency_overrides[NotificationService] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: "test-user-id"

    try:
        response = client.post(
            "/api/v1/notifications/send", json={"message": "Hello World", "title": "Test Title"}
        )

        assert response.status_code == 202
        assert response.json() == {"status": "success"}
        mock_service.notify_user.assert_awaited_once_with(
            "test-user-id", "Hello World", "Test Title"
        )
    finally:
        app.dependency_overrides.clear()
