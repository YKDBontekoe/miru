"""Chat domain models."""

from __future__ import annotations

from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str


class RoomUpdate(BaseModel):
    name: str


class RoomResponse(BaseModel):
    id: str
    name: str
    created_at: str


class RoomAgentAdd(BaseModel):
    agent_id: str


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: str
    room_id: str
    user_id: str | None
    agent_id: str | None
    content: str


class ChatRequest(BaseModel):
    message: str
    use_crew: bool = False  # Set True to route through CrewAI agents
