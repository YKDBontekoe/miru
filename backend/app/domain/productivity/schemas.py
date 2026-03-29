"""Productivity domain Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator


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


class TaskCreate(BaseModel):
    """Schema for creating a new Task.

    Args:
        title: The title of the task.
        description: An optional description.
        is_completed: Indicates whether the task is complete. Defaults to False.
        due_date: Optional due date for the task.
        recurrence_rule: Optional recurrence rule (daily/weekly/biweekly/monthly/yearly).
        recurrence_end_date: Optional end date for the recurrence.
        auto_create_event: When True and due_date is set, auto-creates a linked calendar event.
    """

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    is_completed: bool = False
    due_date: datetime | None = None
    recurrence_rule: str | None = Field(None, pattern=r"^(daily|weekly|biweekly|monthly|yearly)$")
    recurrence_end_date: datetime | None = None
    auto_create_event: bool = False


class TaskUpdate(BaseModel):
    """Schema for updating an existing Task.

    Args:
        title: Optional new title for the task.
        description: Optional new description.
        is_completed: Optional new completion status.
        due_date: Optional new due date.
        recurrence_rule: Optional new recurrence rule.
        recurrence_end_date: Optional new recurrence end date.
    """

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_completed: bool | None = None
    due_date: datetime | None = None
    recurrence_rule: str | None = Field(None, pattern=r"^(daily|weekly|biweekly|monthly|yearly)$")
    recurrence_end_date: datetime | None = None


class TaskResponse(BaseModel):
    """Schema for a Task response.

    This model maps from ORM attributes.

    Args:
        id: Unique identifier for the task.
        user_id: Unique identifier for the owning user.
        title: The title of the task.
        description: The description of the task, if any.
        is_completed: Whether the task is completed.
        due_date: Optional due date for the task.
        recurrence_rule: Optional recurrence rule.
        recurrence_end_date: Optional recurrence end date.
        calendar_event_id: Optional linked calendar event ID.
        created_at: The timestamp when the task was created.
        updated_at: The timestamp when the task was last updated.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None = None
    is_completed: bool
    due_date: datetime | None = None
    recurrence_rule: str | None = None
    recurrence_end_date: datetime | None = None
    calendar_event_id: UUID | None = None
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

    title: str = Field(..., min_length=1, max_length=255)
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

    title: str | None = Field(None, min_length=1, max_length=255)
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
    agent_id: UUID | None = Field(None, validation_alias=AliasChoices("agent", "agent_id"))
    origin_message_id: UUID | None = Field(
        None, validation_alias=AliasChoices("origin_message", "origin_message_id")
    )
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


class CalendarEventCreate(BaseModel):
    """Schema for creating a new Calendar Event."""

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    location: str | None = Field(None, max_length=255)
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None
    origin_context: str | None = None
    recurrence_rule: str | None = Field(None, pattern=r"^(daily|weekly|biweekly|monthly|yearly)$")
    recurrence_end_date: datetime | None = None
    linked_task_id: UUID | None = None

    @model_validator(mode="after")
    def validate_time_range(self) -> CalendarEventCreate:
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be greater than start_time")
        return self


class CalendarEventUpdate(BaseModel):
    """Schema for updating an existing Calendar Event."""

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_all_day: bool | None = None
    location: str | None = Field(None, max_length=255)
    recurrence_rule: str | None = Field(None, pattern=r"^(daily|weekly|biweekly|monthly|yearly)$")
    recurrence_end_date: datetime | None = None


class CalendarEventResponse(BaseModel):
    """Schema for a Calendar Event response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    agent_id: UUID | None = Field(None, validation_alias=AliasChoices("agent", "agent_id"))
    origin_message_id: UUID | None = Field(
        None, validation_alias=AliasChoices("origin_message", "origin_message_id")
    )
    origin_context: str | None = None
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool
    location: str | None = None
    recurrence_rule: str | None = None
    recurrence_end_date: datetime | None = None
    linked_task_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    @field_validator("agent_id", "origin_message_id", mode="before")
    @classmethod
    def extract_uuid(cls, v: Any) -> UUID | None:
        """Extract raw UUID from Tortoise relation proxy if needed."""
        return extract_uuid_from_relation(v)
