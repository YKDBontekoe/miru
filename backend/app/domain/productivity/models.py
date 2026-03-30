"""Productivity domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tortoise import fields

from app.infrastructure.database.base import SupabaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.agents_models import Agent
    from app.infrastructure.database.models.chat_models import ChatMessage


class Task(SupabaseModel):
    """Database entity for User Tasks."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
    title = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    is_completed = fields.BooleanField(default=False)
    due_date = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "tasks"
        sql_policies = [
            "ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY tasks_owner_all ON public.tasks FOR ALL USING (auth.uid() = user_id);",
        ]


class Note(SupabaseModel):
    """Database entity for User Notes."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
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
    origin_context = fields.TextField(null=True)
    title = fields.CharField(max_length=255)
    content = fields.TextField()
    is_pinned = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "notes"
        sql_policies = [
            "ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY notes_owner_all ON public.notes FOR ALL USING (auth.uid() = user_id);",
        ]


class CalendarEvent(SupabaseModel):
    """Database entity for User Calendar Events."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
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
    origin_context = fields.TextField(null=True)
    title = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    start_time = fields.DatetimeField()
    end_time = fields.DatetimeField()
    is_all_day = fields.BooleanField(default=False)
    location = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "calendar_events"
        sql_policies = [
            "ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY calendar_events_owner_all ON public.calendar_events FOR ALL USING (auth.uid() = user_id);",
            "ALTER TABLE public.calendar_events ADD CONSTRAINT check_end_after_start CHECK (end_time > start_time);",
        ]
