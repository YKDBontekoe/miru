"""Chat repository using Tortoise ORM."""

from __future__ import annotations

from uuid import UUID

from app.domain.agents.models import Agent
from app.domain.chat.models import ChatMessage, ChatRoom, ChatRoomAgent


class ChatRepository:
    def __init__(self) -> None:
        pass

    async def create_room(self, name: str, user_id: UUID) -> ChatRoom:
        """Create a new chat room."""
        return await ChatRoom.create(name=name, user_id=user_id)

    async def list_rooms(self, user_id: UUID) -> list[ChatRoom]:
        """List all chat rooms for a user."""
        return await ChatRoom.filter(user_id=user_id).all()

    async def get_room(self, room_id: UUID) -> ChatRoom | None:
        """Fetch a single room."""
        return await ChatRoom.get_or_none(id=room_id)

    async def update_room(self, room_id: UUID, name: str) -> ChatRoom | None:
        """Update a room's name."""
        await ChatRoom.filter(id=room_id).update(name=name)
        return await self.get_room(room_id)

    async def delete_room(self, room_id: UUID) -> bool:
        """Delete a room."""
        deleted_count = await ChatRoom.filter(id=room_id).delete()
        return deleted_count > 0

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> ChatRoomAgent:
        """Associate an agent with a room."""
        # Use _id for foreign keys when passing pure UUIDs in Tortoise
        return await ChatRoomAgent.create(room_id=room_id, agent_id=agent_id)

    async def list_room_agents(self, room_id: UUID) -> list[Agent]:
        """Fetch all agents associated with a room, with integrations prefetched."""
        assocs = await ChatRoomAgent.filter(room_id=room_id).prefetch_related(
            "agent__capabilities", "agent__agent_integrations__integration"
        )
        return [assoc.agent for assoc in assocs]

    async def get_room_messages(self, room_id: UUID) -> list[ChatMessage]:
        """Fetch all messages in a room."""
        return await ChatMessage.filter(room_id=room_id).order_by("created_at").all()

    async def room_belongs_to_user(self, room_id: UUID, user_id: UUID) -> bool:
        """Return True if the room exists and is owned by *user_id*."""
        return await ChatRoom.filter(id=room_id, user_id=user_id).exists()

    async def save_message(self, message: ChatMessage) -> ChatMessage:
        """Save a new message."""
        await message.save()
        return message

    async def touch_room(self, room_id: UUID) -> None:
        """Bump updated_at on a room so recent-chat sorting reflects new messages."""
        from tortoise.timezone import now

        await ChatRoom.filter(id=room_id).update(updated_at=now())
