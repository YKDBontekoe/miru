from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.agents import AgentResponse, ChatMessageResponse, RoomResponse
from app.main import app

# Import the app to get the router


@pytest.fixture
def mock_current_user() -> Any:
    user_id = uuid4()
    with patch("app.auth.get_current_user", return_value=user_id):
        yield user_id


@pytest.fixture
def override_auth() -> Any:
    user_id = uuid4()
    app.dependency_overrides["app.auth.get_current_user"] = lambda: user_id
    yield user_id
    app.dependency_overrides.pop("app.auth.get_current_user", None)


@patch("app.routes.create_agent")
def test_create_agent_route(mock_create_agent: MagicMock) -> None:
    mock_create_agent.return_value = AgentResponse(
        id="123", name="Bot", personality="Nice", created_at="now"
    )

    # We must mock auth to bypass JWT verification
    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/agents",
            headers={"Authorization": "Bearer fake_token"},
            json={"name": "Bot", "personality": "Nice"},
        )

    assert response.status_code == 200
    assert response.json()["name"] == "Bot"


@patch("app.routes.get_agents")
def test_get_agents_route(mock_get_agents: MagicMock) -> None:
    mock_get_agents.return_value = [
        AgentResponse(id="123", name="Bot", personality="Nice", created_at="now")
    ]

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.get("/api/agents", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Bot"


@patch("app.routes.create_room")
def test_create_room_route(mock_create_room: MagicMock) -> None:
    mock_create_room.return_value = RoomResponse(id="room123", name="Chat", created_at="now")

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/rooms", headers={"Authorization": "Bearer fake_token"}, json={"name": "Chat"}
        )

    assert response.status_code == 200
    assert response.json()["name"] == "Chat"


@patch("app.routes.get_rooms")
def test_get_rooms_route(mock_get_rooms: MagicMock) -> None:
    mock_get_rooms.return_value = [RoomResponse(id="room123", name="Chat", created_at="now")]

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.get("/api/rooms", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Chat"


@patch("app.routes.add_agent_to_room")
def test_add_agent_to_room_route(mock_add: MagicMock) -> None:
    mock_add.return_value = {"status": "added"}

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/rooms/room123/agents",
            headers={"Authorization": "Bearer fake_token"},
            json={"agent_id": "agent123"},
        )

    assert response.status_code == 200
    assert response.json() == {"status": "added"}


@patch("app.routes.get_room_agents")
def test_get_room_agents_route(mock_get: MagicMock) -> None:
    mock_get.return_value = [
        AgentResponse(id="123", name="Bot", personality="Nice", created_at="now")
    ]

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.get(
            "/api/rooms/room123/agents", headers={"Authorization": "Bearer fake_token"}
        )

    assert response.status_code == 200
    assert len(response.json()) == 1


@patch("app.routes.get_room_messages")
def test_get_room_messages_route(mock_get: MagicMock) -> None:
    mock_get.return_value = [
        ChatMessageResponse(
            id="m1", room_id="room123", user_id="u1", agent_id=None, content="hi", created_at="now"
        )
    ]

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.get(
            "/api/rooms/room123/messages", headers={"Authorization": "Bearer fake_token"}
        )

    assert response.status_code == 200
    assert len(response.json()) == 1


@patch("app.routes.stream_room_responses")
def test_room_chat_route(mock_stream: MagicMock) -> None:
    async def mock_generator(*args: Any, **kwargs: Any) -> AsyncGenerator[str, None]:
        yield "Hello"

    mock_stream.return_value = mock_generator()

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/rooms/room123/chat",
            headers={"Authorization": "Bearer fake_token"},
            json={"content": "hello"},
        )

    assert response.status_code == 200


# Import the app to get the router


@patch("app.routes.stream_room_responses")
def test_room_chat_route_crew_mock(mock_stream: MagicMock) -> None:
    async def mock_generator(*args: Any, **kwargs: Any) -> AsyncGenerator[str, None]:
        yield "Hello"

    mock_stream.return_value = mock_generator()

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/rooms/room123/chat",
            headers={"Authorization": "Bearer fake_token"},
            json={"content": "hello"},
        )

    assert response.status_code == 200


# Import the app to get the router


@patch("app.routes.create_agent")
def test_create_agent_route_invalid(mock_create_agent: MagicMock) -> None:
    # We must mock auth to bypass JWT verification
    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/agents",
            headers={"Authorization": "Bearer fake_token"},
            json={"name": "Bot"},  # missing personality
        )

    assert response.status_code == 422


client = TestClient(app)
