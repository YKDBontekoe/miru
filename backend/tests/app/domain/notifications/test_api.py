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
