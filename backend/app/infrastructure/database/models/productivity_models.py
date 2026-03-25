"""Productivity domain ORM models using Tortoise ORM."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from tortoise import fields

from app.infrastructure.database.base import SupabaseModel

if TYPE_CHECKING:
    from app.domain.agents.models import Agent
    from app.infrastructure.database.models.chat_models import ChatMessage


class Task(SupabaseModel):
    """Database entity for User Tasks."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    title: str = fields.CharField(max_length=255)  # type: ignore[assignment]
    description: str | None = fields.TextField(null=True)
    is_completed: bool = fields.BooleanField(default=False)  # type: ignore[assignment]
    due_date: datetime | None = fields.DatetimeField(null=True)
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
    location: str | None = fields.CharField(max_length=255, null=True)  # type: ignore[assignment]
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "calendar_events"
        sql_policies = [
            "ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY calendar_events_owner_all ON public.calendar_events FOR ALL USING (auth.uid() = user_id);",
            "ALTER TABLE public.calendar_events ADD CONSTRAINT check_end_after_start CHECK (end_time > start_time);",
        ]
