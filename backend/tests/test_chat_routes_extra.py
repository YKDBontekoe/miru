from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_chat_service
from app.api.v1.chat import router
from app.domain.agents.schemas import AgentResponse
from app.domain.chat.dtos import ChatMessageResponse, RoomResponse

app = FastAPI()
app.include_router(router, prefix="/api/v1/chat")


@pytest.fixture
def mock_service():
    service = AsyncMock()
    return service


@pytest.fixture
def setup_app(mock_service):
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_chat_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: uuid4()
    yield app
    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_add_agent_to_room_route_forbidden(setup_app, mock_service):
    room_id = uuid4()
    mock_service.user_in_room.return_value = False

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            f"/api/v1/chat/rooms/{room_id}/agents", json={"agent_id": str(uuid4())}
        )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_add_agent_to_room_route_agent_not_owned(setup_app, mock_service):
    room_id = uuid4()
    mock_service.user_in_room.return_value = True
    mock_service.add_agent_to_room.side_effect = PermissionError("AGENT_NOT_OWNED")

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            f"/api/v1/chat/rooms/{room_id}/agents", json={"agent_id": str(uuid4())}
        )
    assert res.status_code == 403
    assert res.json()["detail"]["error"] == "AGENT_NOT_OWNED"


@pytest.mark.asyncio
async def test_add_agent_to_room_route_success(setup_app, mock_service):
    room_id = uuid4()
    mock_service.user_in_room.return_value = True
    mock_service.add_agent_to_room.return_value = None

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            f"/api/v1/chat/rooms/{room_id}/agents", json={"agent_id": str(uuid4())}
        )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_remove_agent_from_room_route_forbidden(setup_app, mock_service):
    room_id = uuid4()
    mock_service.user_in_room.return_value = False

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.delete(f"/api/v1/chat/rooms/{room_id}/agents/{uuid4()}")
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_get_room_agents_route_forbidden(setup_app, mock_service):
    room_id = uuid4()
    mock_service.list_room_agents.side_effect = PermissionError("NOT_ROOM_OWNER")

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(f"/api/v1/chat/rooms/{room_id}/agents")
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_get_room_messages_route_forbidden(setup_app, mock_service):
    room_id = uuid4()
    mock_service.get_room_messages.side_effect = PermissionError("NOT_ROOM_OWNER")

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(f"/api/v1/chat/rooms/{room_id}/messages")
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_update_room_route(setup_app, mock_service):
    room_id = uuid4()
    room_res = RoomResponse(
        id=room_id, name="Test", created_at=datetime.now(), updated_at=datetime.now()
    )
    mock_service.update_room.return_value = room_res

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.patch(f"/api/v1/chat/rooms/{room_id}", json={"name": "Test"})
    assert res.status_code == 200
    assert mock_service.update_room.called


@pytest.mark.asyncio
async def test_update_room_route_not_found(setup_app, mock_service):
    room_id = uuid4()
    mock_service.update_room.return_value = None

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.patch(f"/api/v1/chat/rooms/{room_id}", json={"name": "Test"})
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_room_route(setup_app, mock_service):
    room_id = uuid4()
    mock_service.delete_room.return_value = True

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.delete(f"/api/v1/chat/rooms/{room_id}")
    assert res.status_code == 200
    assert mock_service.delete_room.called


@pytest.mark.asyncio
async def test_delete_room_route_not_found(setup_app, mock_service):
    room_id = uuid4()
    mock_service.delete_room.return_value = False

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.delete(f"/api/v1/chat/rooms/{room_id}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_get_room_agents_route_success(setup_app, mock_service):
    room_id = uuid4()
    agent_res = AgentResponse(
        id=uuid4(),
        name="Agent",
        description="A",
        personality="Friendly",
        system_prompt="s",
        status="active",
        mood="neutral",
        message_count=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        integration_configs={},
    )
    mock_service.list_room_agents.return_value = [agent_res]

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(f"/api/v1/chat/rooms/{room_id}/agents")
    assert res.status_code == 200
    assert mock_service.list_room_agents.called


@pytest.mark.asyncio
async def test_get_room_messages_route_success(setup_app, mock_service):
    room_id = uuid4()
    msg_res = ChatMessageResponse(
        id=uuid4(),
        room_id=room_id,
        user_id=uuid4(),
        agent_id=None,
        content="Hello",
        created_at=datetime.now(),
    )
    mock_service.get_room_messages.return_value = [msg_res]

    transport = ASGITransport(app=setup_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(f"/api/v1/chat/rooms/{room_id}/messages")
    assert res.status_code == 200
    assert mock_service.get_room_messages.called
