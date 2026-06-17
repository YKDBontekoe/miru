"""Data Transfer Objects for the Chat domain."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


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


class AgentMessage(BaseModel):
    """Represents a single message from an agent in the chat.

    Attributes:
        agent_name: The name of the agent speaking.
        message: The response content from the agent.
    """

    agent_name: str = Field(..., min_length=1, description="The name of the agent speaking.")
    message: str = Field(..., min_length=1, description="The response content from the agent.")


class ChatCrewOutput(BaseModel):
    """The structured output format for a CrewAI orchestration task.

    Attributes:
        messages: A list of messages from the participating agents.
    """

    messages: list[AgentMessage] = Field(
        ..., min_length=1, description="A list of messages from the participating agents."
    )
