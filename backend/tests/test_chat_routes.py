import typing
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.domain.chat.service import ChatService


def test_chat_route(client: TestClient) -> None:
    with patch("app.api.v1.chat.get_chat_service") as mock_get_service:
        mock_service = AsyncMock(spec=ChatService)

        async def mock_stream(
            *args: typing.Any, **kwargs: typing.Any
        ) -> typing.AsyncGenerator[str, None]:
            yield "Hello"
            yield " World"

        mock_service.stream_responses = mock_stream
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/v1/chat",
            json={"message": "Hello"},
            headers={"Accept-Language": "fr-FR", "Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200


def test_run_crew_route(client: TestClient) -> None:
    with patch("app.api.v1.chat.get_chat_service") as mock_get_service:
        mock_service = AsyncMock(spec=ChatService)
        mock_service.run_crew.return_value = {"task_type": "general", "result": "Test result"}
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/v1/crew",
            json={"message": "Do task"},
            headers={"Accept-Language": "de-DE", "Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200
        assert response.json() == {"task_type": "general", "result": "Test result"}


def test_chat_in_room_route(client: TestClient) -> None:
    with patch("app.api.v1.chat.get_chat_service") as mock_get_service:
        mock_service = AsyncMock(spec=ChatService)

        async def mock_stream(
            *args: typing.Any, **kwargs: typing.Any
        ) -> typing.AsyncGenerator[str, None]:
            yield "Room"
            yield " Message"

        mock_service.stream_room_responses = mock_stream
        mock_get_service.return_value = mock_service

        room_id = str(uuid4())

        response = client.post(
            f"/api/v1/rooms/{room_id}/chat",
            json={"message": "Hi in room"},
            headers={"Accept-Language": "es-ES", "Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200
