from __future__ import annotations

from azure.messaging.webpubsubservice import WebPubSubServiceClient

from app.core.config import get_settings


def get_webpubsub_client() -> WebPubSubServiceClient | None:
    settings = get_settings()
    if not settings.azure_webpubsub_connection_string:
        return None

    return WebPubSubServiceClient.from_connection_string(
        connection_string=settings.azure_webpubsub_connection_string,
        hub=settings.azure_webpubsub_hub,
    )
