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

    # SEC(agent): Fixed IDOR. Ensuring all operations are scoped to user_id to prevent unauthorized access to other users' Chat Rooms and Agents.
    async def get_room(self, room_id: UUID, user_id: UUID) -> ChatRoom | None:
        """Fetch a single room."""
        return await ChatRoom.get_or_none(id=room_id, user_id=user_id)

    async def update_room(self, room_id: UUID, name: str, user_id: UUID) -> ChatRoom | None:
        """Update a room's name."""
        room = await self.get_room(room_id, user_id)
        if room:
            room.name = name
            await room.save()
        return room

    async def delete_room(self, room_id: UUID, user_id: UUID) -> bool:
        """Delete a room."""
        room = await self.get_room(room_id, user_id)
        if room:
            await room.delete()
            return True
        return False

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID, user_id: UUID) -> ChatRoomAgent:
        """Associate an agent with a room."""
        room = await self.get_room(room_id, user_id)
        agent = await Agent.get_or_none(id=agent_id, user_id=user_id)
        if not room or not agent:
            raise ValueError("Room or Agent not found or unauthorized")

        # Use _id for foreign keys when passing pure UUIDs in Tortoise
        return await ChatRoomAgent.create(room_id=room_id, agent_id=agent_id)

    async def list_room_agents(self, room_id: UUID, user_id: UUID) -> list[Agent]:
        """Fetch all agents associated with a room, with integrations prefetched."""
        room = await self.get_room(room_id, user_id)
        if not room:
            return []

        assocs = await ChatRoomAgent.filter(room_id=room_id).prefetch_related(
            "agent__agent_integrations__integration"
        )
        return [assoc.agent for assoc in assocs]

    async def get_room_messages(self, room_id: UUID, user_id: UUID) -> list[ChatMessage]:
        """Fetch all messages in a room."""
        room = await self.get_room(room_id, user_id)
        if not room:
            return []

        return await ChatMessage.filter(room_id=room_id).order_by("created_at").all()

    async def save_message(self, message: ChatMessage) -> ChatMessage:
        """Save a new message."""
        await message.save()
        return message
