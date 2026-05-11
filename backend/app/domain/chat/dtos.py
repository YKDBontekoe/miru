"""Data Transfer Objects for the Chat domain."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, TypeAdapter, field_validator


class WSBaseMessage(BaseModel):
    pass


class WSPingMessage(WSBaseMessage):
    type: Literal["ping"]


class WSJoinRoomMessage(WSBaseMessage):
    type: Literal["join_room"]
    room_id: UUID


class WSLeaveRoomMessage(WSBaseMessage):
    type: Literal["leave_room"]
    room_id: UUID


class WSSendMessageMessage(WSBaseMessage):
    type: Literal["send_message"]
    room_id: UUID
    content: str = Field(..., max_length=10000)
    client_temp_id: str | None = Field(None, max_length=255, alias="clientTempId")


ClientWSMessage = Annotated[
    WSPingMessage | WSJoinRoomMessage | WSLeaveRoomMessage | WSSendMessageMessage,
    Field(discriminator="type"),
]
ClientWSMessageAdapter = TypeAdapter(ClientWSMessage)


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


class RoomAgentSummaryResponse(BaseModel):
    id: UUID
    name: str


class RoomSummaryResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    agents: list[RoomAgentSummaryResponse]
    last_message: str | None = None
    last_message_at: datetime | None = None
    has_mention: bool = False
    has_task: bool = False


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
    content: str = Field(..., min_length=1)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be blank or whitespace only")
        return v.strip()
