"""Memory domain Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MemoryResponse(BaseModel):
    """Schema for returning memory data.

    Attributes:
        id: Unique identifier for the memory.
        user_id: Optional ID of the user the memory belongs to.
        agent_id: Optional ID of the agent the memory belongs to.
        room_id: Optional ID of the chat room where the memory originated.
        content: The text content of the memory.
        meta: Additional metadata for the memory.
        created_at: Timestamp when the memory was created.
        updated_at: Timestamp when the memory was last updated.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    agent_id: UUID | None
    room_id: UUID | None
    content: str
    meta: dict
    created_at: datetime
    updated_at: datetime


class MemoryRequest(BaseModel):
    """Schema for requesting a new memory to be stored.

    Attributes:
        message: The content of the memory to store. Must be non-empty and not just whitespace.
    """

    message: str = Field(..., min_length=1, pattern=r"\S")
