import typing
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.chat.service import ChatService


@pytest.fixture
def chat_service() -> ChatService:
    chat_repo = AsyncMock()

    async def mock_save_message(msg: typing.Any) -> typing.Any:
        msg.id = msg.id or uuid4()
        return msg

    chat_repo.save_message = AsyncMock(side_effect=mock_save_message)
    agent_repo = AsyncMock()
    memory_repo = AsyncMock()
    agent_service = AsyncMock()
    bg_service = AsyncMock()
    return ChatService(chat_repo, agent_repo, memory_repo, agent_service, bg_service)


@pytest.mark.asyncio
async def test_update_room(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    from datetime import UTC, datetime

    from app.domain.chat.entities import ChatRoomEntity

    now = datetime.now(UTC)
    chat_service.chat_repo.update_room.return_value = ChatRoomEntity(
        id=room_id,
        user_id=user_id,
        name="New Name",
        created_at=now,
        updated_at=now,
        deleted_at=None,
        summary=None,
    )
    result = await chat_service.update_room(room_id, "New Name", user_id)
    assert result.name == "New Name"
    chat_service.chat_repo.update_room.return_value = None
    result_fail = await chat_service.update_room(room_id, "New Name", user_id)
    assert result_fail is None


@pytest.mark.asyncio
async def test_delete_room(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    chat_service.chat_repo.delete_room.return_value = True
    result = await chat_service.delete_room(room_id, user_id)
    assert result is True


@pytest.mark.asyncio
async def test_add_agent_to_room_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()
    chat_service.chat_repo.room_belongs_to_user.return_value = False
    result = await chat_service.add_agent_to_room(room_id, agent_id, user_id)
    assert result is None
    chat_service.chat_repo.room_belongs_to_user.return_value = True
    chat_service.chat_repo.add_agent_to_room.return_value = True
    result_success = await chat_service.add_agent_to_room(room_id, agent_id, user_id)
    assert result_success is True


@pytest.mark.asyncio
async def test_remove_agent_from_room_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()
    chat_service.chat_repo.room_belongs_to_user.return_value = False
    result = await chat_service.remove_agent_from_room(room_id, agent_id, user_id)
    assert result is False
    chat_service.chat_repo.room_belongs_to_user.return_value = True
    chat_service.chat_repo.remove_agent_from_room.return_value = True
    result_success = await chat_service.remove_agent_from_room(room_id, agent_id, user_id)
    assert result_success is True


@pytest.mark.asyncio
async def test_list_room_agents_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    chat_service.chat_repo.room_belongs_to_user.return_value = False
    result = await chat_service.list_room_agents(room_id, user_id)
    assert result is None
    chat_service.chat_repo.room_belongs_to_user.return_value = True
    chat_service.chat_repo.list_room_agents.return_value = ["agent"]
    result_success = await chat_service.list_room_agents(room_id, user_id)
    assert result_success == ["agent"]


@pytest.mark.asyncio
async def test_get_room_messages_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    chat_service.chat_repo.room_belongs_to_user.return_value = False
    result = await chat_service.get_room_messages(room_id, user_id)
    assert result is None
    chat_service.chat_repo.room_belongs_to_user.return_value = True
    from app.domain.chat.entities import ChatMessageEntity

    chat_service.chat_repo.get_room_messages.return_value = [
        ChatMessageEntity(id=uuid4(), room_id=room_id, user_id=user_id, content="test")
    ]
    result_success = await chat_service.get_room_messages(room_id, user_id)
    assert len(result_success) == 1
