from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.chat import (
    add_agent_to_room,
    chat,
    chat_in_room,
    create_room,
    delete_room,
    get_room_agents,
    get_room_messages,
    list_rooms,
    run_crew,
    submit_feedback,
    update_room,
)
from app.domain.chat.models import (
    AddAgentToRoom,
    ChatMessageResponse,
    ChatRequest,
    MessageFeedbackRequest,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)


@pytest.fixture
def mock_service() -> AsyncMock:
    return AsyncMock()

@pytest.fixture
def user_id() -> uuid4:
    return uuid4()

@pytest.fixture
def room_id() -> uuid4:
    return uuid4()

@pytest.mark.asyncio
async def test_list_rooms(mock_service: AsyncMock, user_id: uuid4) -> None:
    mock_service.list_rooms.return_value = [RoomResponse(id=uuid4(), name="Test", created_at=datetime.now(UTC))]
    res = await list_rooms(user_id=user_id, service=mock_service)
    assert len(res) == 1

@pytest.mark.asyncio
async def test_create_room(mock_service: AsyncMock, user_id: uuid4) -> None:
    req = RoomCreate(name="New Room")
    mock_service.create_room.return_value = RoomResponse(id=uuid4(), name="New Room", created_at=datetime.now(UTC))
    res = await create_room(data=req, user_id=user_id, service=mock_service)
    assert res.name == "New Room"

@pytest.mark.asyncio
async def test_chat_success(mock_service: AsyncMock, user_id: uuid4) -> None:
    req = ChatRequest(message="Hello", style_preference="Pirate")
    async def mock_stream(): yield "Arrr"
    mock_service.stream_responses.return_value = mock_stream()
    res = await chat(request=req, user_id=user_id, service=mock_service)
    assert res is not None

@pytest.mark.asyncio
async def test_chat_no_message(mock_service: AsyncMock, user_id: uuid4) -> None:
    req = ChatRequest()
    with pytest.raises(HTTPException):
        await chat(request=req, user_id=user_id, service=mock_service)

@pytest.mark.asyncio
async def test_run_crew_success(mock_service: AsyncMock, user_id: uuid4) -> None:
    req = ChatRequest(message="Help")
    mock_service.run_crew.return_value = {"result": "ok"}
    res = await run_crew(request=req, user_id=user_id, service=mock_service)
    assert res["result"] == "ok"

@pytest.mark.asyncio
async def test_run_crew_no_message(mock_service: AsyncMock, user_id: uuid4) -> None:
    req = ChatRequest()
    with pytest.raises(HTTPException):
        await run_crew(request=req, user_id=user_id, service=mock_service)

@pytest.mark.asyncio
async def test_update_room(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    req = RoomUpdate(name="Updated")
    mock_service.update_room.return_value = RoomResponse(id=room_id, name="Updated", created_at=datetime.now(UTC))
    res = await update_room(room_id=room_id, data=req, _user_id=user_id, service=mock_service)
    assert res.name == "Updated"

@pytest.mark.asyncio
async def test_update_room_not_found(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    req = RoomUpdate(name="Updated")
    mock_service.update_room.return_value = None
    with pytest.raises(HTTPException):
        await update_room(room_id=room_id, data=req, _user_id=user_id, service=mock_service)

@pytest.mark.asyncio
async def test_delete_room(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    mock_service.delete_room.return_value = True
    res = await delete_room(room_id=room_id, _user_id=user_id, service=mock_service)
    assert res["status"] == "ok"

@pytest.mark.asyncio
async def test_delete_room_not_found(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    mock_service.delete_room.return_value = False
    with pytest.raises(HTTPException):
        await delete_room(room_id=room_id, _user_id=user_id, service=mock_service)

@pytest.mark.asyncio
async def test_add_agent_to_room(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    req = AddAgentToRoom(agent_id=uuid4())
    res = await add_agent_to_room(room_id=room_id, data=req, _user_id=user_id, service=mock_service)
    assert res["status"] == "ok"

@pytest.mark.asyncio
async def test_get_room_agents(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    class DummyAgent:
        def __init__(self):
            self.id = uuid4()
            self.name = "A"
            self.personality = "P"
            self.description = None
            self.system_prompt = None
            self.integration_configs = {}
            self.status = "active"
            self.mood = "Neutral"
            self.message_count = 0
            self.created_at = datetime.now(UTC)
            self.updated_at = datetime.now(UTC)
            self.capabilities = []
            self.integrations = []
            self.goals = []
            self.user_id = uuid4()
    mock_service.list_room_agents.return_value = [DummyAgent()]
    res = await get_room_agents(room_id=room_id, _user_id=user_id, service=mock_service)
    assert len(res) == 1

@pytest.mark.asyncio
async def test_get_room_messages(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    mock_msg = ChatMessageResponse(id=uuid4(), room_id=room_id, content="Hi", created_at=datetime.now(UTC))
    mock_service.get_room_messages.return_value = [mock_msg]
    res = await get_room_messages(room_id=room_id, _user_id=user_id, service=mock_service)
    assert len(res) == 1

@pytest.mark.asyncio
async def test_chat_in_room_success(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    req = ChatRequest(message="Hello", style_preference="Concise")
    async def mock_stream(): yield "Hey"
    mock_service.stream_room_responses.return_value = mock_stream()
    res = await chat_in_room(room_id=room_id, request=req, user_id=user_id, service=mock_service)
    assert res is not None

@pytest.mark.asyncio
async def test_chat_in_room_no_message(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    req = ChatRequest()
    with pytest.raises(HTTPException):
        await chat_in_room(room_id=room_id, request=req, user_id=user_id, service=mock_service)

@pytest.mark.asyncio
async def test_submit_feedback(mock_service: AsyncMock, user_id: uuid4, room_id: uuid4) -> None:
    req = MessageFeedbackRequest(is_positive=True)
    msg_id = uuid4()
    mock_service.handle_feedback.return_value = ChatMessageResponse(id=msg_id, room_id=room_id, content="C", feedback="positive", created_at=datetime.now(UTC))
    res = await submit_feedback(message_id=msg_id, request=req, user_id=user_id, service=mock_service)
    assert res.feedback == "positive"
