from __future__ import annotations

import typing
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.chat.entities import ChatMessageEntity, ChatRoomEntity
from app.domain.chat.service import ChatService


@pytest.mark.asyncio
async def test_update_room(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()

    now = datetime.now(UTC)
    typing.cast("AsyncMock", chat_service.chat_repo.update_room).return_value = ChatRoomEntity(
        id=room_id,
        user_id=user_id,
        name="New Name",
        created_at=now,
        updated_at=now,
        deleted_at=None,
        summary=None,
    )
    result = await chat_service.update_room(room_id, "New Name", user_id)
    assert result is not None
    assert result.name == "New Name"
    typing.cast("AsyncMock", chat_service.chat_repo.update_room).return_value = None
    result_fail = await chat_service.update_room(room_id, "New Name", user_id)
    assert result_fail is None


@pytest.mark.asyncio
async def test_delete_room(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.delete_room).return_value = True
    result = await chat_service.delete_room(room_id, user_id)
    assert result is True


@pytest.mark.asyncio
async def test_add_agent_to_room_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = False
    result = await chat_service.add_agent_to_room(room_id, agent_id, user_id)
    assert result is None
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = True
    typing.cast("AsyncMock", chat_service.chat_repo.add_agent_to_room).return_value = True
    result_success = await chat_service.add_agent_to_room(room_id, agent_id, user_id)
    assert result_success is True


@pytest.mark.asyncio
async def test_remove_agent_from_room_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = False
    result = await chat_service.remove_agent_from_room(room_id, agent_id, user_id)
    assert result is False
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = True
    typing.cast("AsyncMock", chat_service.chat_repo.remove_agent_from_room).return_value = True
    result_success = await chat_service.remove_agent_from_room(room_id, agent_id, user_id)
    assert result_success is True


@pytest.mark.asyncio
async def test_list_room_agents_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = False
    result = await chat_service.list_room_agents(room_id, user_id)
    assert result is None
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = True
    typing.cast("AsyncMock", chat_service.chat_repo.list_room_agents).return_value = ["agent"]
    result_success = await chat_service.list_room_agents(room_id, user_id)
    assert result_success == ["agent"]


@pytest.mark.asyncio
async def test_get_room_messages_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = False
    result = await chat_service.get_room_messages(room_id, user_id)
    assert result is None
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = True

    typing.cast("AsyncMock", chat_service.chat_repo.get_room_messages).return_value = [
        ChatMessageEntity(id=uuid4(), room_id=room_id, user_id=user_id, content="test")
    ]
    result_success = await chat_service.get_room_messages(room_id, user_id)
    assert result_success is not None
    assert len(result_success) == 1


@pytest.mark.asyncio
async def test_list_room_summaries(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()
    now = datetime.now(UTC)

    typing.cast("AsyncMock", chat_service.chat_repo.list_rooms).return_value = [
        ChatRoomEntity(
            id=room_id,
            user_id=user_id,
            name="Daily planning",
            created_at=now,
            updated_at=now,
            deleted_at=None,
            summary=None,
        )
    ]

    agent = SimpleNamespace(id=agent_id, name="Planner")
    typing.cast("AsyncMock", chat_service.chat_repo.list_room_agents).return_value = [agent]
    typing.cast("AsyncMock", chat_service.chat_repo.get_latest_room_message).return_value = (
        ChatMessageEntity(
            id=uuid4(),
            room_id=room_id,
            user_id=user_id,
            content="@planner action item for today",
            created_at=now,
        )
    )

    summaries = await chat_service.list_room_summaries(user_id)
    assert len(summaries) == 1
    assert summaries[0].id == room_id
    assert summaries[0].agents[0].id == agent_id
    assert summaries[0].has_mention is True
    assert summaries[0].has_task is True
