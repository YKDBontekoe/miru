"""Memory domain models and database entities."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, SQLModel


class Memory(SQLModel, table=True):
    """Database entity for Memories (Vector Store)."""

    __tablename__ = "memories"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID | None = Field(default=None, index=True)
    agent_id: UUID | None = Field(default=None, index=True)
    room_id: UUID | None = Field(default=None, index=True)

    content: str
    embedding: list[float] = Field(sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MemoryRequest(SQLModel):
    message: str


class MemoryRelationship(SQLModel, table=True):
    """Represents a relationship between two memories in the database."""

    __tablename__ = "memory_relationships"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    source_id: UUID = Field(foreign_key="memories.id", ondelete="CASCADE")
    target_id: UUID = Field(foreign_key="memories.id", ondelete="CASCADE")
    relationship_type: str = Field(default="RELATED_TO")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
