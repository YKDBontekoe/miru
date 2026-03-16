"""Tests for Chat API Routes."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.api.dependencies import get_chat_service
from app.domain.chat.service import ChatService

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


@pytest.fixture
def mock_chat_service() -> AsyncMock:
    return AsyncMock(spec=ChatService)


@pytest.fixture
def override_chat_service(client: TestClient, mock_chat_service: AsyncMock) -> None:
    client.app.dependency_overrides[get_chat_service] = lambda: mock_chat_service


@pytest.mark.asyncio
async def test_update_room_not_found(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    mock_chat_service.update_room.return_value = None

    response = client.patch(
        f"/api/v1/rooms/{room_id}",
        json={"name": "New Name"},
        headers=authed_headers,
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}


@pytest.mark.asyncio
async def test_update_room_success(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    mock_room = MagicMock()
    mock_room.id = room_id
    mock_room.name = "New Name"
    mock_room.created_at = "2024-01-01T00:00:00Z"
    mock_chat_service.update_room.return_value = mock_room

    response = client.patch(
        f"/api/v1/rooms/{room_id}",
        json={"name": "New Name"},
        headers=authed_headers,
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": str(room_id),
        "name": "New Name",
        "created_at": "2024-01-01T00:00:00Z",
    }


@pytest.mark.asyncio
async def test_delete_room_not_found(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    mock_chat_service.delete_room.return_value = False

    response = client.delete(f"/api/v1/rooms/{room_id}", headers=authed_headers)
    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}


@pytest.mark.asyncio
async def test_delete_room_success(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    mock_chat_service.delete_room.return_value = True

    response = client.delete(f"/api/v1/rooms/{room_id}", headers=authed_headers)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_add_agent_to_room_not_found(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    agent_id = uuid4()
    mock_chat_service.add_agent_to_room.side_effect = ValueError(
        "Room or Agent not found or unauthorized"
    )

    response = client.post(
        f"/api/v1/rooms/{room_id}/agents",
        json={"agent_id": str(agent_id)},
        headers=authed_headers,
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Room or Agent not found or unauthorized"}


@pytest.mark.asyncio
async def test_add_agent_to_room_success(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    agent_id = uuid4()
    mock_chat_service.add_agent_to_room.return_value = None

    response = client.post(
        f"/api/v1/rooms/{room_id}/agents",
        json={"agent_id": str(agent_id)},
        headers=authed_headers,
    )
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_get_room_agents(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    mock_chat_service.list_room_agents.return_value = []

    response = client.get(f"/api/v1/rooms/{room_id}/agents", headers=authed_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_room_messages(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    room_id = uuid4()
    mock_chat_service.get_room_messages.return_value = []

    response = client.get(f"/api/v1/rooms/{room_id}/messages", headers=authed_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_run_crew(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    mock_chat_service.run_crew.return_value = {"task_type": "general", "result": "hello"}

    response = client.post(
        "/api/v1/crew",
        json={"message": "hello"},
        headers=authed_headers,
    )
    assert response.status_code == 200
    assert response.json() == {"task_type": "general", "result": "hello"}


@pytest.mark.asyncio
async def test_run_crew_missing_message(
    client: TestClient,
    mock_chat_service: AsyncMock,
    override_chat_service: None,
    authed_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/crew",
        json={"message": ""},
        headers=authed_headers,
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Message or content is required"}
