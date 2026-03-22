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
async def test_update_room_success() -> None:
    service = AsyncMock()
    mock_room = AsyncMock()
    service.update_room.return_value = mock_room
    result = await update_room(uuid4(), RoomUpdate(name="Test"), uuid4(), service)
    assert result == mock_room


@pytest.mark.asyncio
async def test_update_room_not_found() -> None:
    service = AsyncMock()
    service.update_room.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await update_room(uuid4(), RoomUpdate(name="Test"), uuid4(), service)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_room_success() -> None:
    service = AsyncMock()
    service.delete_room.return_value = True
    result = await delete_room(uuid4(), uuid4(), service)
    assert result == {"status": "ok"}


@pytest.mark.asyncio
async def test_delete_room_not_found() -> None:
    service = AsyncMock()
    service.delete_room.return_value = False
    with pytest.raises(HTTPException) as exc_info:
        await delete_room(uuid4(), uuid4(), service)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_add_agent_to_room_success() -> None:
    service = AsyncMock()
    result = await add_agent_to_room(uuid4(), AddAgentToRoom(agent_id=uuid4()), uuid4(), service)
    assert result == {"status": "ok"}


@pytest.mark.asyncio
async def test_get_room_agents_success() -> None:
    service = AsyncMock()
    service.list_room_agents.return_value = []
    result = await get_room_agents(uuid4(), uuid4(), service)
    assert result == []


@pytest.mark.asyncio
async def test_get_room_messages_success() -> None:
    service = AsyncMock()
    service.get_room_messages.return_value = []
    result = await get_room_messages(uuid4(), uuid4(), service)
    assert result == []
