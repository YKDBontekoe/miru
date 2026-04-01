from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from app.core.config import Settings, get_settings
from app.infrastructure.notifications.azure_hubs import \
    AzureNotificationHubClient


@pytest.fixture
def mock_settings() -> Settings:
    settings = get_settings()
    settings.azure_notification_hub_name = "test-hub"
    settings.azure_notification_hub_connection_string = "Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=testkey"
    return settings


@pytest.mark.asyncio
@patch("app.infrastructure.notifications.azure_hubs.AzureNotificationHub")
async def test_azure_client_initialization(
    mock_hub_class: MagicMock, mock_settings: Settings
) -> None:
    client = AzureNotificationHubClient()
    assert client.hub is not None
    mock_hub_class.assert_called_once_with(
        "Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=testkey",
        "test-hub",
    )


@pytest.mark.asyncio
@patch("app.infrastructure.notifications.azure_hubs.AzureNotificationHub")
async def test_send_notification_success(
    mock_hub_class: MagicMock, mock_settings: Settings
) -> None:
    client = AzureNotificationHubClient()
    mock_hub_instance = mock_hub_class.return_value
    mock_hub_instance.send_notification = MagicMock()

    await client.send_notification({"msg": "Hello"}, ["tag1"])

    mock_hub_instance.send_notification.assert_called_once()
    args, kwargs = mock_hub_instance.send_notification.call_args
    notification = args[0]
    tags = args[1]

    assert notification.format == "template"
    assert notification.payload == '{"msg": "Hello"}'
    assert tags == ["tag1"]


@pytest.mark.asyncio
@patch("app.infrastructure.notifications.azure_hubs.AzureNotificationHub")
async def test_send_notification_uninitialized(
    mock_hub_class: MagicMock, mock_settings: Settings
) -> None:
    # Temporarily unset settings
    mock_settings.azure_notification_hub_name = None
    mock_settings.azure_notification_hub_connection_string = None

    client = AzureNotificationHubClient()
    assert client.hub is None

    # Should safely return without exception
    await client.send_notification({"msg": "Hello"}, ["tag1"])


@pytest.mark.asyncio
@patch("app.infrastructure.notifications.azure_hubs.AzureNotificationHub")
async def test_send_notification_exception(
    mock_hub_class: MagicMock, mock_settings: Settings
) -> None:
    client = AzureNotificationHubClient()
    mock_hub_instance = mock_hub_class.return_value
    mock_hub_instance.send_notification.side_effect = Exception("API Error")

    with pytest.raises(Exception, match="API Error"):
        await client.send_notification({"msg": "Hello"}, ["tag1"])
