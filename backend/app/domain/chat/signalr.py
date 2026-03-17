from __future__ import annotations

from azure.messaging.webpubsubservice.aio import WebPubSubServiceClient

from app.core.config import get_settings


def get_webpubsub_client() -> WebPubSubServiceClient | None:
    """Gets the Web PubSub client for sending SignalR messages.

    This function reads the Azure Web PubSub connection string from the
    application settings. If the connection string is configured, it
    initializes and returns a WebPubSubServiceClient.

    Returns:
        WebPubSubServiceClient: The initialized client if configured.
        None: If the `azure_webpubsub_connection_string` setting is not set.
    """
    settings = get_settings()
    if not settings.azure_webpubsub_connection_string:
        return None

    return WebPubSubServiceClient.from_connection_string(
        connection_string=settings.azure_webpubsub_connection_string,
        hub=settings.azure_webpubsub_hub,
    )
