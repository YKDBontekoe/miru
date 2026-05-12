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
        message: str,
        user_id: object,
        accept_language: str | None = None,
        **kwargs: object,
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
        assert body["detail"]["error"] == "message_not_found"
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
        assert body["detail"]["error"] == "message_not_found"
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


def test_get_room_summaries_endpoint(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    agent_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.list_room_summaries.return_value = [
        {
            "id": room_id,
            "name": "Daily planning",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
            "agents": [{"id": agent_id, "name": "Planner"}],
            "last_message": "Plan my day",
            "last_message_at": "2026-01-01T00:05:00Z",
            "has_mention": False,
            "has_task": True,
        }
    ]
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get("/api/v1/rooms/summaries", headers=authed_headers)
        assert response.status_code == 200
        body = response.json()
        assert body[0]["id"] == str(room_id)
        assert body[0]["agents"][0]["id"] == str(agent_id)
        assert body[0]["has_task"] is True
        mock_service.list_room_summaries.assert_called_once_with(user_id, limit=50, before_id=None)
    finally:
        app.dependency_overrides.clear()


def test_get_room_summaries_endpoint_empty(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.list_room_summaries.return_value = []
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get("/api/v1/rooms/summaries", headers=authed_headers)
        assert response.status_code == 200
        assert response.json() == []
        mock_service.list_room_summaries.assert_called_once_with(user_id, limit=50, before_id=None)
    finally:
        app.dependency_overrides.clear()

def test_list_rooms_endpoint(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.list_rooms.return_value = []
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get("/api/v1/rooms", headers=authed_headers)
        assert response.status_code == 200
        assert response.json() == []
        mock_service.list_rooms.assert_called_once_with(user_id)
    finally:
        app.dependency_overrides.clear()


def test_create_room_endpoint(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.create_room.return_value = {
        "id": room_id,
        "name": "New Room",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/v1/rooms",
            json={"name": "New Room"},
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New Room"
        mock_service.create_room.assert_called_once_with("New Room", user_id)
    finally:
        app.dependency_overrides.clear()


def test_chat_route_missing_message(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/v1/chat",
            json={"message": ""},
            headers=authed_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"]["error"] == "message_required"
    finally:
        app.dependency_overrides.clear()


def test_run_crew_route_missing_message(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/v1/crew",
            json={"message": ""},
            headers=authed_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"]["error"] == "message_required"
    finally:
        app.dependency_overrides.clear()


def test_update_room_endpoint(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.update_room.return_value = {
        "id": room_id,
        "name": "Updated Room",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.patch(
            f"/api/v1/rooms/{room_id}",
            json={"name": "Updated Room"},
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Room"
        mock_service.update_room.assert_called_once_with(room_id, "Updated Room", user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_delete_room_endpoint(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.delete_room.return_value = True
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.delete(
            f"/api/v1/rooms/{room_id}",
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_service.delete_room.assert_called_once_with(room_id, user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_add_agent_to_room_endpoint_success(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    agent_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.add_agent_to_room.return_value = True
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            f"/api/v1/rooms/{room_id}/agents",
            json={"agent_id": str(agent_id)},
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_service.add_agent_to_room.assert_called_once_with(room_id, agent_id, user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_add_agent_to_room_endpoint_not_found(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    agent_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.add_agent_to_room.return_value = None
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.post(
            f"/api/v1/rooms/{room_id}/agents",
            json={"agent_id": str(agent_id)},
            headers=authed_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"] == "room_not_found"
    finally:
        app.dependency_overrides.clear()


def test_get_room_agents_endpoint_success(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    agent_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.list_room_agents.return_value = [
        {
            "id": agent_id,
            "name": "Test Agent",
            "personality": "Helpful",
            "description": "desc",
            "type": "custom",
            "system_prompt": "prompt",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
            "user_id": user_id,
            "capabilities": [],
            "message_count": 0,
        }
    ]
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get(
            f"/api/v1/rooms/{room_id}/agents",
            headers=authed_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["name"] == "Test Agent"
        mock_service.list_room_agents.assert_called_once_with(room_id, user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_remove_agent_from_room_endpoint_success(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    agent_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.remove_agent_from_room.return_value = True
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.delete(
            f"/api/v1/rooms/{room_id}/agents/{agent_id}",
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_service.remove_agent_from_room.assert_called_once_with(room_id, agent_id, user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_remove_agent_from_room_endpoint_not_found(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    agent_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.remove_agent_from_room.return_value = False
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.delete(
            f"/api/v1/rooms/{room_id}/agents/{agent_id}",
            headers=authed_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"] == "agent_not_in_room"
    finally:
        app.dependency_overrides.clear()


def test_get_room_messages_endpoint_success(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    message_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.get_room_messages.return_value = [
        {
            "id": message_id,
            "room_id": room_id,
            "role": "user",
            "content": "Hello",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        }
    ]
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.get(
            f"/api/v1/rooms/{room_id}/messages",
            headers=authed_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["content"] == "Hello"
        mock_service.get_room_messages.assert_called_once_with(room_id, user_id=user_id, limit=50, before_id=None)
    finally:
        app.dependency_overrides.clear()


def test_update_message_endpoint_success(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    message_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.update_message.return_value = {
        "id": message_id,
        "room_id": room_id,
        "role": "user",
        "content": "Updated",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.patch(
            f"/api/v1/rooms/{room_id}/messages/{message_id}",
            json={"content": "Updated"},
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json()["content"] == "Updated"
        mock_service.update_message.assert_called_once_with(message_id, "Updated", user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_update_room_endpoint_not_found(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.update_room.return_value = None
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.patch(
            f"/api/v1/rooms/{room_id}",
            json={"name": "Updated Room"},
            headers=authed_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"] == "room_not_found"
    finally:
        app.dependency_overrides.clear()


def test_delete_message_endpoint_success(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    message_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.delete_message.return_value = True
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.delete(
            f"/api/v1/rooms/{room_id}/messages/{message_id}",
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_service.delete_message.assert_called_once_with(message_id, user_id=user_id)
    finally:
        app.dependency_overrides.clear()


def test_delete_room_endpoint_not_found(client: TestClient, authed_headers: dict) -> None:
    user_id = uuid4()
    room_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_service = AsyncMock(spec=ChatService)
    mock_service.delete_room.return_value = False
    app.dependency_overrides[get_chat_service] = lambda: mock_service

    try:
        response = client.delete(
            f"/api/v1/rooms/{room_id}",
            headers=authed_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"] == "room_not_found"
    finally:
        app.dependency_overrides.clear()
