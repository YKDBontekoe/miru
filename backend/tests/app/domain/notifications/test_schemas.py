from __future__ import annotations

from app.domain.notifications.schemas import NotificationRequest


def test_notification_request_default_title() -> None:
    request = NotificationRequest(message="Test message")
    assert request.message == "Test message"
    assert request.title == "New Notification"


def test_notification_request_custom_title() -> None:
    request = NotificationRequest(message="Test message", title="Custom Title")
    assert request.message == "Test message"
    assert request.title == "Custom Title"
