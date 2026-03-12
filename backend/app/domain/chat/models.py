"""Chat domain models and database entities."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ChatRoom(SQLModel, table=True):
    """Database entity for Chat Rooms."""

    __tablename__ = "chat_rooms"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(index=True)
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ChatRoomAgent(SQLModel, table=True):
    """Junction table for Chat Rooms and Agents."""

    __tablename__ = "chat_room_agents"

    room_id: UUID = Field(foreign_key="chat_rooms.id", primary_key=True)
    agent_id: UUID = Field(foreign_key="agents.id", primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ChatMessage(SQLModel, table=True):
    """Database entity for Chat Messages."""

    __tablename__ = "chat_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(foreign_key="chat_rooms.id", index=True)
    user_id: UUID | None = Field(default=None, index=True)
    agent_id: UUID | None = Field(default=None, index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class RoomCreate(SQLModel):
    name: str


class RoomUpdate(SQLModel):
    name: str


class AddAgentToRoom(SQLModel):
    agent_id: UUID


class RoomResponse(SQLModel):
    id: UUID
    name: str
    created_at: datetime


class ChatMessageResponse(SQLModel):
    id: UUID
    room_id: UUID
    user_id: UUID | None
    agent_id: UUID | None
    content: str
    created_at: datetime


class ChatRequest(SQLModel):
    message: str | None = None
    content: str | None = None
    use_crew: bool = False
