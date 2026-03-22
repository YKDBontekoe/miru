from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.chat import (
    add_agent_to_room,
    delete_room,
    get_room_agents,
    get_room_messages,
    update_room,
)
from app.domain.chat.models import AddAgentToRoom, RoomUpdate


@pytest.mark.asyncio
async def test_update_room_value_error() -> None:
    service = AsyncMock()
    service.update_room.side_effect = ValueError("Unauthorized")
    with pytest.raises(HTTPException) as exc_info:
        await update_room(uuid4(), RoomUpdate(name="Test"), uuid4(), service)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Room not found"


@pytest.mark.asyncio
async def test_delete_room_value_error() -> None:
    service = AsyncMock()
    service.delete_room.side_effect = ValueError("Unauthorized")
    with pytest.raises(HTTPException) as exc_info:
        await delete_room(uuid4(), uuid4(), service)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Room not found"


@pytest.mark.asyncio
async def test_add_agent_to_room_value_error() -> None:
    service = AsyncMock()
    service.add_agent_to_room.side_effect = ValueError("Unauthorized")
    with pytest.raises(HTTPException) as exc_info:
        await add_agent_to_room(uuid4(), AddAgentToRoom(agent_id=uuid4()), uuid4(), service)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Room not found"


@pytest.mark.asyncio
async def test_get_room_agents_value_error() -> None:
    service = AsyncMock()
    service.list_room_agents.side_effect = ValueError("Unauthorized")
    with pytest.raises(HTTPException) as exc_info:
        await get_room_agents(uuid4(), uuid4(), service)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Room not found"


@pytest.mark.asyncio
async def test_get_room_messages_value_error() -> None:
    service = AsyncMock()
    service.get_room_messages.side_effect = ValueError("Unauthorized")
    with pytest.raises(HTTPException) as exc_info:
        await get_room_messages(uuid4(), uuid4(), service)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Room not found"
