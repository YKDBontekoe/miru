"""Chat repository using Tortoise ORM."""

from __future__ import annotations

from uuid import UUID

from app.domain.agents.models import Agent
from app.domain.chat.entities import ChatMessageEntity, ChatRoomAgentEntity, ChatRoomEntity
from app.infrastructure.database.models.chat_models import ChatMessage, ChatRoom, ChatRoomAgent


def _map_room_to_entity(room: ChatRoom) -> ChatRoomEntity:
    return ChatRoomEntity(
        id=room.id,
        user_id=room.user_id,
        name=room.name,
        created_at=room.created_at,
        updated_at=room.updated_at,
        deleted_at=room.deleted_at,
    )


def _map_message_to_entity(message: ChatMessage) -> ChatMessageEntity:
    return ChatMessageEntity(
        id=message.id,
        room_id=getattr(message, "room_id"),  # type: ignore[arg-type]
        content=message.content,
        message_type=message.message_type,
        user_id=message.user_id,
        agent_id=message.agent_id,
        attachments=message.attachments,
        created_at=message.created_at,
        updated_at=message.updated_at,
        deleted_at=message.deleted_at,
    )


class ChatRepository:
    def __init__(self) -> None:
        pass

    async def create_room(self, name: str, user_id: UUID) -> ChatRoomEntity:
        """Create a new chat room."""
        room = await ChatRoom.create(name=name, user_id=user_id)
        return _map_room_to_entity(room)

    async def list_rooms(self, user_id: UUID) -> list[ChatRoomEntity]:
        """List all chat rooms for a user."""
        rooms = await ChatRoom.filter(user_id=user_id).all()
        return [_map_room_to_entity(room) for room in rooms]

    async def get_room(self, room_id: UUID) -> ChatRoomEntity | None:
        """Fetch a single room."""
        room = await ChatRoom.get_or_none(id=room_id)
        return _map_room_to_entity(room) if room else None

    async def update_room(self, room_id: UUID, name: str) -> ChatRoomEntity | None:
        """Update a room's name."""
        room = await ChatRoom.get_or_none(id=room_id)
        if room:
            room.name = name
            await room.save()
            return _map_room_to_entity(room)
        return None

    async def delete_room(self, room_id: UUID) -> bool:
        """Delete a room."""
        room = await ChatRoom.get_or_none(id=room_id)
        if room:
            await room.delete()
            return True
        return False

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> ChatRoomAgentEntity:
        """Associate an agent with a room."""
        assoc = await ChatRoomAgent.create(room_id=room_id, agent_id=agent_id)
        return ChatRoomAgentEntity(
            room_id=getattr(assoc, "room_id"),  # type: ignore[arg-type]
            agent_id=getattr(assoc, "agent_id"),  # type: ignore[arg-type]
            created_at=assoc.created_at,
        )

    async def list_room_agents(self, room_id: UUID) -> list[Agent]:
        """Fetch all agents associated with a room, with integrations prefetched."""
        assocs = await ChatRoomAgent.filter(room_id=room_id).prefetch_related(
            "agent__capabilities", "agent__agent_integrations__integration"
        )
        return [assoc.agent for assoc in assocs]

    async def get_room_messages(self, room_id: UUID) -> list[ChatMessageEntity]:
        """Fetch all messages in a room."""
        messages = await ChatMessage.filter(room_id=room_id).order_by("created_at").all()
        return [_map_message_to_entity(msg) for msg in messages]

    async def room_belongs_to_user(self, room_id: UUID, user_id: UUID) -> bool:
        """Return True if the room exists and is owned by *user_id*."""
        return await ChatRoom.filter(id=room_id, user_id=user_id).exists()

    async def save_message(self, message: ChatMessageEntity) -> ChatMessageEntity:
        """Save a new message or update an existing one."""
        if hasattr(message, "id") and message.id:
            # Check if it exists
            msg_model = await ChatMessage.get_or_none(id=message.id)
            if msg_model:
                msg_model.content = message.content
                msg_model.message_type = message.message_type
                msg_model.attachments = message.attachments
                await msg_model.save()
                return _map_message_to_entity(msg_model)

        # Create new
        msg_model = await ChatMessage.create(
            room_id=message.room_id,
            user_id=message.user_id,
            agent_id=message.agent_id,
            content=message.content,
            message_type=message.message_type,
            attachments=message.attachments,
        )
        return _map_message_to_entity(msg_model)

    async def touch_room(self, room_id: UUID) -> None:
        """Bump updated_at on a room so recent-chat sorting reflects new messages."""
        room = await ChatRoom.get_or_none(id=room_id)
        if room:
            await room.save()  # auto_now=True on updated_at refreshes the timestamp
