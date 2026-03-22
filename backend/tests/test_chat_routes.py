from __future__ import annotations

import typing
from unittest.mock import AsyncMock
from uuid import uuid4

from app.api.dependencies import get_chat_service
from app.core.security.auth import get_current_user
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
        assert mock_service.run_crew.call_args[0][2] == "de-DE"
    finally:
        app.dependency_overrides.clear()


def test_chat_in_room_route(client: TestClient) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)

    async def mock_stream(
        room_id: typing.Any,
        message: str,
        user_id: typing.Any,
        accept_language: str | None = None,
        **kwargs: typing.Any,
    ) -> typing.AsyncGenerator[str, None]:
        assert accept_language == "es-ES"
        yield "Room"
        yield " Message"

    mock_service.stream_room_responses = mock_stream
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    room_id = str(uuid4())

    try:
        response = client.post(
            f"/api/v1/rooms/{room_id}/chat",
            json={"message": "Hi in room"},
            headers={"Accept-Language": "es-ES", "Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
