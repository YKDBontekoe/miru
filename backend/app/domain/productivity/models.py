"""Productivity domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel

if TYPE_CHECKING:
    from app.domain.agents.models import Agent
    from app.domain.chat.models import ChatMessage


class Task(SupabaseModel):
    """Database entity for User Tasks."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    title: str = fields.CharField(max_length=255)  # type: ignore[assignment]
    description: str | None = fields.TextField(null=True)
    is_completed: bool = fields.BooleanField(default=False)  # type: ignore[assignment]
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "tasks"
        sql_policies = [
            "ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY tasks_owner_all ON public.tasks FOR ALL USING (auth.uid() = user_id);",
        ]


class Note(SupabaseModel):
    """Database entity for User Notes."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    agent: fields.ForeignKeyNullableRelation[Agent] = fields.ForeignKeyField(
        "models.Agent",
        related_name="notes",
        null=True,
        db_index=True,
        on_delete=fields.SET_NULL,
    )
    origin_message: fields.ForeignKeyNullableRelation[ChatMessage] = fields.ForeignKeyField(
        "models.ChatMessage",
        related_name="originated_notes",
        null=True,
        db_index=True,
        on_delete=fields.SET_NULL,
    )
    origin_context: str | None = fields.TextField(null=True)
    title: str = fields.CharField(max_length=255)  # type: ignore[assignment]
    content: str = fields.TextField()
    is_pinned: bool = fields.BooleanField(default=False)  # type: ignore[assignment]
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "notes"
        sql_policies = [
            "ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY notes_owner_all ON public.notes FOR ALL USING (auth.uid() = user_id);",
        ]


def extract_uuid_from_relation(v: Any) -> UUID | None:
    """Extract raw UUID from Tortoise relation proxy if needed.

    Relation proxies expose the raw PK via attributes like "pk" or "id".
    Returns None if those attributes are absent or the value is None.
    """
    if v is None:
        return None
    if isinstance(v, UUID):
        return v
    return getattr(v, "pk", None) or getattr(v, "id", None)


# ---------------------------------------------------------------------------
# API Pydantic Schemas

# ---------------------------------------------------------------------------


class TaskCreate(BaseModel):
    """Schema for creating a new Task.

    Args:
        title: The title of the task.
        description: An optional description.
        is_completed: Indicates whether the task is complete. Defaults to False.
    """

    title: str
    description: str | None = None
    is_completed: bool = False


class TaskUpdate(BaseModel):
    """Schema for updating an existing Task.

    Args:
        title: Optional new title for the task.
        description: Optional new description.
        is_completed: Optional new completion status.
    """

    title: str | None = None
    description: str | None = None
    is_completed: bool | None = None


class TaskResponse(BaseModel):
    """Schema for a Task response.

    This model maps from ORM attributes.

    Args:
        id: Unique identifier for the task.
        user_id: Unique identifier for the owning user.
        title: The title of the task.
        description: The description of the task, if any.
        is_completed: Whether the task is completed.
        created_at: The timestamp when the task was created.
        updated_at: The timestamp when the task was last updated.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None = None
    is_completed: bool
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    """Schema for creating a new Note.

    Args:
        title: The title of the note.
        content: The text content of the note.
        is_pinned: Whether the note is pinned. Defaults to False.
        agent_id: Optional ID of the agent that created the note.
        origin_message_id: Optional ID of the message that triggered the note creation.
        origin_context: Optional context/description of why the note was created.
    """

    title: str
    content: str
    is_pinned: bool = False
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None
    origin_context: str | None = None


class NoteUpdate(BaseModel):
    """Schema for updating an existing Note.

    Args:
        title: Optional new title for the note.
        content: Optional new content for the note.
        is_pinned: Optional new pinned status.
    """

    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


class NoteResponse(BaseModel):
    """Schema for a Note response.

    This model maps from ORM attributes.

    Args:
        id: Unique identifier for the note.
        user_id: Unique identifier for the owning user.
        title: The title of the note.
        content: The text content of the note.
        is_pinned: Whether the note is pinned.
        agent_id: Optional ID of the agent that created the note.
        origin_message_id: Optional ID of the message that triggered the note creation.
        origin_context: Optional context/description of why the note was created.
        created_at: The timestamp when the note was created.
        updated_at: The timestamp when the note was last updated.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    agent_id: UUID | None = Field(None, validation_alias="agent")
    origin_message_id: UUID | None = Field(None, validation_alias="origin_message")
    origin_context: str | None = None
    title: str
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    @field_validator("agent_id", "origin_message_id", mode="before")
    @classmethod
    def extract_uuid(cls, v: Any) -> UUID | None:
        """Extract raw UUID from Tortoise relation proxy if needed."""
        return extract_uuid_from_relation(v)


class CalendarEvent(SupabaseModel):
    """Database entity for User Calendar Events."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    agent: fields.ForeignKeyNullableRelation[Agent] = fields.ForeignKeyField(
        "models.Agent",
        related_name="calendar_events",
        null=True,
        db_index=True,
        on_delete=fields.SET_NULL,
    )
    origin_message: fields.ForeignKeyNullableRelation[ChatMessage] = fields.ForeignKeyField(
        "models.ChatMessage",
        related_name="originated_events",
        null=True,
        db_index=True,
        on_delete=fields.SET_NULL,
    )
    origin_context: str | None = fields.TextField(null=True)
    title: str = fields.CharField(max_length=255)  # type: ignore[assignment]
    description: str | None = fields.TextField(null=True)
    start_time: datetime = fields.DatetimeField()
    end_time: datetime = fields.DatetimeField()
    is_all_day: bool = fields.BooleanField(default=False)  # type: ignore[assignment]
    location: str | None = fields.CharField(max_length=255, null=True)
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "calendar_events"
        sql_policies = [
            "ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY calendar_events_owner_all ON public.calendar_events FOR ALL USING (auth.uid() = user_id);",
            "ALTER TABLE public.calendar_events ADD CONSTRAINT check_end_after_start CHECK (end_time >= start_time);",
        ]


class CalendarEventCreate(BaseModel):
    """Schema for creating a new Calendar Event."""

    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    location: str | None = None
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None
    origin_context: str | None = None

    @model_validator(mode="after")
    def validate_time_range(self) -> CalendarEventCreate:
        if self.end_time < self.start_time:
            raise ValueError("end_time must be greater than or equal to start_time")
        return self


class CalendarEventUpdate(BaseModel):
    """Schema for updating an existing Calendar Event."""

    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_all_day: bool | None = None
    location: str | None = None


class CalendarEventResponse(BaseModel):
    """Schema for a Calendar Event response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    agent_id: UUID | None = Field(None, validation_alias="agent")
    origin_message_id: UUID | None = Field(None, validation_alias="origin_message")
    origin_context: str | None = None
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool
    location: str | None = None
    created_at: datetime
    updated_at: datetime

    @field_validator("agent_id", "origin_message_id", mode="before")
    @classmethod
    def extract_uuid(cls, v: Any) -> UUID | None:
        """Extract raw UUID from Tortoise relation proxy if needed."""
        return extract_uuid_from_relation(v)
