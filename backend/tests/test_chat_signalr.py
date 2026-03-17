from __future__ import annotations

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_chat_service
from app.domain.chat.signalr import get_webpubsub_client
from app.main import app

client = TestClient(app)


def mock_current_user():
    return uuid4()


def test_get_webpubsub_client_none(monkeypatch):
    from app.core.config import Settings

    def mock_get_settings():
        return Settings(
            openrouter_api_key="test",
            supabase_url="test",
            supabase_key="test",
            supabase_service_role_key="test",
            supabase_jwt_secret="test",
            embedding_model="test",
            default_chat_model="test",
            azure_webpubsub_connection_string=None,
        )

    monkeypatch.setattr("app.domain.chat.signalr.get_settings", mock_get_settings)
    assert get_webpubsub_client() is None


@patch("app.domain.chat.signalr.WebPubSubServiceClient")
def test_get_webpubsub_client_configured(mock_client, monkeypatch):
    from app.core.config import Settings

    def mock_get_settings():
        return Settings(
            openrouter_api_key="test",
            supabase_url="test",
            supabase_key="test",
            supabase_service_role_key="test",
            supabase_jwt_secret="test",
            embedding_model="test",
            default_chat_model="test",
            azure_webpubsub_connection_string="Endpoint=https://test.webpubsub.azure.com;AccessKey=test;Version=1.0;",
        )

    monkeypatch.setattr("app.domain.chat.signalr.get_settings", mock_get_settings)
    c = get_webpubsub_client()
    assert c is not None


def test_negotiate_endpoint_no_client(monkeypatch):
    app.dependency_overrides[mock_current_user] = mock_current_user
    monkeypatch.setattr("app.api.v1.chat.get_webpubsub_client", lambda: None)

    # Needs auth bypass
    # The endpoint uses CurrentUser
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = mock_current_user

    response = client.post("/api/v1/negotiate")
    assert response.status_code == 500
    assert response.json()["detail"] == "Azure Web PubSub not configured"


@patch("app.api.v1.chat.get_webpubsub_client")
def test_negotiate_endpoint_success(mock_get_client, monkeypatch):
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = mock_current_user

    mock_client_instance = MagicMock()
    mock_client_instance.get_client_access_token.return_value = {
        "url": "wss://test",
        "token": "abc",
    }
    mock_get_client.return_value = mock_client_instance

    response = client.post("/api/v1/negotiate")
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "wss://test"
    assert data["accessToken"] == "abc"


def test_webhook_options():
    response = client.options("/api/v1/webhook", headers={"webhook-request-origin": "test.com"})
    assert response.status_code == 200
    assert response.headers["WebHook-Allowed-Origin"] == "test.com"

    response = client.options("/api/v1/webhook")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_webhook_post_success():
    from app.domain.chat.service import ChatService

    mock_chat_service = MagicMock(spec=ChatService)

    # We mock stream_responses to yield something so process_chat can consume it
    async def mock_stream(*args, **kwargs):
        yield "response"

    mock_chat_service.stream_responses.side_effect = mock_stream

    app.dependency_overrides[get_chat_service] = lambda: mock_chat_service

    uid = str(uuid4())
    headers = {"ce-userid": uid, "ce-type": "azure.webpubsub.user.message"}
    payload = {"arguments": ["hello"]}

    response = client.post("/api/v1/webhook", json=payload, headers=headers)
    assert response.status_code == 200

    # Also test error payloads
    response = client.post("/api/v1/webhook", json={}, headers=headers)
    assert response.status_code == 200  # Unknown payload

    response = client.post(
        "/api/v1/webhook", json={"arguments": ["hi"]}, headers={"ce-type": "other"}
    )
    assert response.status_code == 200  # Ignored event type

    response = client.post(
        "/api/v1/webhook",
        json={"arguments": ["hi"]},
        headers={"ce-userid": "not-uuid", "ce-type": "azure.webpubsub.user.message"},
    )
    assert response.status_code == 400
