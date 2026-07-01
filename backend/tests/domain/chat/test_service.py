from unittest.mock import AsyncMock, patch

import pytest

from app.domain.agents.models import Agent as AgentModel
from app.domain.chat.service import ChatService
from app.infrastructure.database.models.auth_models import Profile
from app.infrastructure.database.models.chat_models import ChatRoom, ChatRoomAgent

pytestmark = pytest.mark.asyncio

async def test_chat_service_create_and_list_rooms(
    chat_service: ChatService,
    test_user: Profile
) -> None:
    # Arrange
    room_name = "Test Room"

    # Act
    created_room = await chat_service.create_room(name=room_name, user_id=test_user.id)
    listed_rooms = await chat_service.list_rooms(user_id=test_user.id)

    # Assert
    assert created_room.name == room_name
    assert len(listed_rooms) == 1
    assert listed_rooms[0].id == created_room.id

    # Verify via DB
    db_room = await ChatRoom.get(id=created_room.id)
    assert db_room.name == room_name
    assert db_room.user_id == test_user.id

async def test_chat_service_update_and_delete_room(
    chat_service: ChatService,
    test_user: Profile
) -> None:
    # Arrange
    room = await chat_service.create_room(name="Initial Room", user_id=test_user.id)

    # Act - Update
    updated_name = "Updated Room"
    updated_room = await chat_service.update_room(room_id=room.id, name=updated_name, user_id=test_user.id)

    # Assert - Update
    assert updated_room is not None
    assert updated_room.name == updated_name

    db_room = await ChatRoom.get(id=room.id)
    assert db_room.name == updated_name

    # Act - Delete
    delete_result = await chat_service.delete_room(room_id=room.id, user_id=test_user.id)

    # Assert - Delete
    assert delete_result is True

    db_room = await ChatRoom.get_or_none(id=room.id)
    assert db_room is None

async def test_chat_service_add_and_remove_agent(
    chat_service: ChatService,
    test_user: Profile
) -> None:
    # Arrange
    room = await chat_service.create_room(name="Agent Room", user_id=test_user.id)
    agent = await AgentModel.create(
        user_id=test_user.id,
        name="Test Agent",
        system_prompt="You are a test agent.",
        personality="Test personality"
    )

    # Act - Add Agent
    added_agent_entity = await chat_service.add_agent_to_room(room_id=room.id, agent_id=agent.id, user_id=test_user.id)

    # Assert - Add Agent
    assert added_agent_entity is not None
    assert added_agent_entity.agent_id == agent.id

    db_room_agent = await ChatRoomAgent.get_or_none(room_id=room.id, agent_id=agent.id)
    assert db_room_agent is not None

    # Act - List Agents
    listed_agents = await chat_service.list_room_agents(room_id=room.id, user_id=test_user.id)
    assert listed_agents is not None
    assert len(listed_agents) == 1
    assert listed_agents[0].id == agent.id

    # Act - Remove Agent
    remove_result = await chat_service.remove_agent_from_room(room_id=room.id, agent_id=agent.id, user_id=test_user.id)

    # Assert - Remove Agent
    assert remove_result is True

    db_room_agent_deleted = await ChatRoomAgent.get_or_none(room_id=room.id, agent_id=agent.id)
    assert db_room_agent_deleted is None

@patch("app.domain.chat.service.stream_chat")
async def test_chat_service_stream_responses_timeout(
    mock_stream_chat: AsyncMock,
    chat_service: ChatService,
    test_user: Profile
) -> None:
    # Arrange
    await AgentModel.create(
        user_id=test_user.id,
        name="Timeout Agent",
        system_prompt="You are a timeout agent.",
        personality="Timeout personality"
    )
    mock_stream_chat.side_effect = TimeoutError()

    # Act
    chunks = []
    async for chunk in chat_service.stream_responses(user_message="Hello", user_id=test_user.id):
        chunks.append(chunk)

    # Assert
    full_response = "".join(chunks)
    assert "Connection timed out" in full_response
    assert "[[STATUS:error]]" in full_response

async def test_chat_service_run_crew_no_agents(
    chat_service: ChatService,
    test_user: Profile
) -> None:
    # Arrange - Ensure no agents exist for the user
    await AgentModel.filter(user_id=test_user.id).delete()

    # Act
    result = await chat_service.run_crew(user_message="Hello", user_id=test_user.id)

    # Assert
    assert result["task_type"] == "error"
    assert result["result"] == "No agents available."

@patch("app.infrastructure.websocket.manager.chat_hub.broadcast_to_room")
async def test_chat_service_run_room_chat_ws_unauthorized(
    mock_broadcast: AsyncMock,
    chat_service: ChatService,
    test_user: Profile
) -> None:
    # Arrange
    # Create room with a DIFFERENT user ID
    from uuid import uuid4
    other_user = await Profile.create(
        id=uuid4(),
        display_name="other"
    )
    room = await chat_service.create_room(name="Unauthorized Room", user_id=other_user.id)

    # Act
    await chat_service.run_room_chat_ws(
        room_id=room.id,
        user_message="Hello",
        user_id=test_user.id
    )

    # Assert
    mock_broadcast.assert_called_once()
    call_args = mock_broadcast.call_args[0]
    assert call_args[0] == room.id
    assert call_args[1]["type"] == "error"
    assert "Unauthorized or room not found" in call_args[1]["data"]["message"]
