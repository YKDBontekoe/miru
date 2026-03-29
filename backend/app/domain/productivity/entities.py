"""Plain Domain Entities for Productivity."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class TaskEntity:
    id: UUID
    user_id: UUID
    title: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    description: str | None = None
    due_date: datetime | None = None
    recurrence_rule: str | None = None
    recurrence_end_date: datetime | None = None
    calendar_event_id: UUID | None = None
    deleted_at: datetime | None = None


@dataclass
class NoteEntity:
    id: UUID
    user_id: UUID
    title: str
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None
    origin_context: str | None = None
    deleted_at: datetime | None = None


@dataclass
class CalendarEventEntity:
    id: UUID
    user_id: UUID
    title: str
    start_time: datetime
    end_time: datetime
    is_all_day: bool
    created_at: datetime
    updated_at: datetime
    description: str | None = None
    location: str | None = None
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None
    origin_context: str | None = None
    recurrence_rule: str | None = None
    recurrence_end_date: datetime | None = None
    linked_task_id: UUID | None = None
    deleted_at: datetime | None = None
