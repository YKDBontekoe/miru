from __future__ import annotations

import pytest

from app.domain.notifications.use_cases.send_notification import SendNotificationUseCase


class MockNotificationClient:
    def __init__(self) -> None:
        self.payload: dict | None = None
        self.tags: list[str] | None = None

    async def send_notification(self, payload: dict, tags: list[str] | None = None) -> None:
        self.payload = payload
        self.tags = tags


@pytest.mark.asyncio
async def test_send_notification_success() -> None:
    client = MockNotificationClient()
    use_case = SendNotificationUseCase(notification_client=client)

    await use_case.execute(user_id="user123", message="Hello World")

    assert client.payload == {"message": "Hello World", "title": "New Notification"}
    assert client.tags == ["user:user123"]


@pytest.mark.asyncio
async def test_send_notification_custom_title() -> None:
    client = MockNotificationClient()
    use_case = SendNotificationUseCase(notification_client=client)

    await use_case.execute(user_id="user123", message="Hello World", title="Custom Alert")

    assert client.payload == {"message": "Hello World", "title": "Custom Alert"}
    assert client.tags == ["user:user123"]


@pytest.mark.asyncio
async def test_send_notification_empty_user_id() -> None:
    client = MockNotificationClient()
    use_case = SendNotificationUseCase(notification_client=client)

    with pytest.raises(ValueError, match="user_id cannot be empty"):
        await use_case.execute(user_id="", message="Hello World")


@pytest.mark.asyncio
async def test_send_notification_client_failure() -> None:
    class FailingMockNotificationClient(MockNotificationClient):
        async def send_notification(self, payload: dict, tags: list[str] | None = None) -> None:
            raise RuntimeError("send failed")

    client = FailingMockNotificationClient()
    use_case = SendNotificationUseCase(notification_client=client)

    with pytest.raises(RuntimeError, match="send failed"):
        await use_case.execute(user_id="user123", message="Hello World")
