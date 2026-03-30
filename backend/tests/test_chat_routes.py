from __future__ import annotations

import typing
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.api.dependencies import get_chat_service
from app.core.security.auth import get_current_user
from app.domain.chat.dtos import MessageUpdate
from app.domain.chat.service import ChatService
from app.main import app

if typing.TYPE_CHECKING:
    from fastapi.testclient import TestClient


def test_chat_route(client: TestClient) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)

    async def mock_stream(
        message: str, user_id: typing.Any, accept_language: str | None = None, **kwargs: typing.Any
    ) -> typing.AsyncGenerator[str, None]:
        assert accept_language == "fr-FR"
        yield "Hello"
        yield " World"

    mock_service.stream_responses = mock_stream
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/v1/chat",
            json={"message": "Hello"},
            headers={"Accept-Language": "fr-FR", "Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_run_crew_route(client: TestClient) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.run_crew.return_value = {"task_type": "general", "result": "Test result"}
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/v1/crew",
            json={"message": "Do task"},
            headers={"Accept-Language": "de-DE", "Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200
        assert response.json() == {"task_type": "general", "result": "Test result"}

        # Verify the Accept-Language header is passed correctly
        mock_service.run_crew.assert_called_once()
        _, kwargs = mock_service.run_crew.call_args
        assert kwargs.get("accept_language") == "de-DE"
    finally:
        app.dependency_overrides.clear()


def test_update_message_route_not_found(client: TestClient) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.update_message.return_value = None
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        room_id = uuid4()
        message_id = uuid4()
        response = client.patch(
            f"/api/v1/rooms/{room_id}/messages/{message_id}",
            json={"content": "Updated content"},
            headers={"Authorization": "Bearer test-token"},
        )
        assert response.status_code == 404
        body = response.json()
        assert body["detail"]["error"] == "MESSAGE_NOT_FOUND"
    finally:
        app.dependency_overrides.clear()


def test_delete_message_route_not_found(client: TestClient) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.delete_message.return_value = False
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        room_id = uuid4()
        message_id = uuid4()
        response = client.delete(
            f"/api/v1/rooms/{room_id}/messages/{message_id}",
            headers={"Authorization": "Bearer test-token"},
        )
        assert response.status_code == 404
        body = response.json()
        assert body["detail"]["error"] == "MESSAGE_NOT_FOUND"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize("bad_content", ["", "   ", "\t\n"])
def test_message_update_blank_content_rejected(bad_content: str) -> None:
    """MessageUpdate must reject blank or whitespace-only content."""
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        MessageUpdate(content=bad_content)


def test_get_room_agents_endpoint_404(client: TestClient, authed_headers: dict) -> None:
    room_id = uuid4()
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.list_room_agents.return_value = None
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get(f"/api/v1/rooms/{room_id}/agents", headers=authed_headers)
        assert response.status_code == 404
        assert mock_service.list_room_agents.called
    finally:
        app.dependency_overrides.clear()


def test_get_room_messages_endpoint_404(client: TestClient, authed_headers: dict) -> None:
    room_id = uuid4()
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.get_room_messages.return_value = None
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get(f"/api/v1/rooms/{room_id}/messages", headers=authed_headers)
        assert response.status_code == 404
        assert mock_service.get_room_messages.called
    finally:
        app.dependency_overrides.clear()
