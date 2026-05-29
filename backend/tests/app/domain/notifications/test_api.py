from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.v1.notifications import get_notification_client
from app.domain.notifications.interfaces.notification_client import INotificationClient
from app.main import app


class MockNotificationClient(INotificationClient):
    def __init__(self) -> None:
        self.payload: Any | None = None
        self.tags: Sequence[str] | None = None

    async def send_notification(self, payload: Any, tags: Sequence[str] | None = None) -> None:
        self.payload = payload
        self.tags = tags


@pytest.fixture
def mock_client():
    return MockNotificationClient()


@pytest.fixture
def client(mock_client):
    app.dependency_overrides[get_notification_client] = lambda: mock_client
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_send_notification_endpoint(client, authed_headers):
    response = client.post(
        "/api/v1/notifications/send",
        json={"message": "Test message", "title": "Test Title"},
        headers=authed_headers,
    )
    assert response.status_code == 202
    assert response.json() == {"status": "success"}

def test_send_notification_endpoint_error(client, authed_headers):
    # simulate a use_case ValueError failure directly inside test
    from unittest.mock import AsyncMock, patch
    from app.api.v1.notifications import get_send_notification_use_case

    mock_use_case = AsyncMock()
    mock_use_case.execute.side_effect = ValueError("Invalid")

    app.dependency_overrides[get_send_notification_use_case] = lambda: mock_use_case
    response = client.post(
        "/api/v1/notifications/send",
        json={"message": "Test message", "title": "Test Title"},
        headers=authed_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"]["message"] == "Invalid user ID"
