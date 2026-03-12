"""Chat repository for SQLModel operations."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlmodel import col, select

from app.domain.agents.models import Agent
from app.domain.chat.models import ChatMessage, ChatRoom, ChatRoomAgent

if TYPE_CHECKING:
    from uuid import UUID

    from sqlmodel.ext.asyncio.session import AsyncSession


class ChatRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_room(self, name: str, user_id: UUID) -> ChatRoom:
        """Create a new chat room."""
        room = ChatRoom(name=name, user_id=user_id)
        self.session.add(room)
        await self.session.commit()
        await self.session.refresh(room)
        return room

    async def list_rooms(self, user_id: UUID) -> list[ChatRoom]:
        """List all chat rooms for a user."""
        statement = select(ChatRoom).where(ChatRoom.user_id == user_id)
        result = await self.session.exec(statement)
        return list(result.all())

    async def get_room(self, room_id: UUID) -> ChatRoom | None:
        """Fetch a single room."""
        return await self.session.get(ChatRoom, room_id)

    async def update_room(self, room_id: UUID, name: str) -> ChatRoom | None:
        """Update a room's name."""
        room = await self.session.get(ChatRoom, room_id)
        if room:
            room.name = name
            self.session.add(room)
            await self.session.commit()
            await self.session.refresh(room)
        return room

    async def delete_room(self, room_id: UUID) -> bool:
        """Delete a room."""
        room = await self.session.get(ChatRoom, room_id)
        if room:
            await self.session.delete(room)
            await self.session.commit()
            return True
        return False

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> ChatRoomAgent:
        """Associate an agent with a room."""
        assoc = ChatRoomAgent(room_id=room_id, agent_id=agent_id)
        self.session.add(assoc)
        await self.session.commit()
        await self.session.refresh(assoc)
        return assoc

    async def list_room_agents(self, room_id: UUID) -> list[Agent]:
        """Fetch all agents associated with a room."""
        statement = (
            select(Agent)
            .join(ChatRoomAgent, col(Agent.id) == col(ChatRoomAgent.agent_id))
            .where(ChatRoomAgent.room_id == room_id)
        )
        result = await self.session.exec(statement)
        return list(result.all())

    async def get_room_messages(self, room_id: UUID) -> list[ChatMessage]:
        """Fetch all messages in a room."""
        # Use col() to ensure it is treated as a ColumnElement by mypy
        statement = (
            select(ChatMessage)
            .where(ChatMessage.room_id == room_id)
            .order_by(col(ChatMessage.created_at))
        )
        result = await self.session.exec(statement)
        return list(result.all())

    async def save_message(self, message: ChatMessage) -> ChatMessage:
        """Save a new message."""
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message
