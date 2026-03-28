"""Memory domain Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MemoryResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    agent_id: UUID | None
    room_id: UUID | None
    content: str
    meta: dict
    created_at: datetime
    updated_at: datetime


class MemoryRequest(BaseModel):
    message: str
