"""Pure domain entities for Chat."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class ChatRoomEntity:
    """Domain Entity representing a Chat Room."""

    id: UUID
    user_id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


@dataclass
class ChatMessageEntity:
    """Domain Entity representing a Chat Message."""

    id: UUID
    room_id: UUID
    content: str
    message_type: str = "text"
    user_id: UUID | None = None
    agent_id: UUID | None = None
    attachments: list = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None


@dataclass
class ChatRoomAgentEntity:
    """Domain Entity representing the association between a Room and an Agent."""

    room_id: UUID
    agent_id: UUID
    created_at: datetime = field(default_factory=datetime.utcnow)
