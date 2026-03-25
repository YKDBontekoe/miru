"""Data Transfer Objects for the Chat domain."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str


class RoomUpdate(BaseModel):
    name: str


class AddAgentToRoom(BaseModel):
    agent_id: UUID


class RoomResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime


class ChatMessageResponse(BaseModel):
    id: UUID
    room_id: UUID
    user_id: UUID | None = None
    agent_id: UUID | None = None
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    message: str | None = None
    content: str | None = None
    use_crew: bool = False


class MessageUpdate(BaseModel):
    content: str
