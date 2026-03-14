"""Productivity domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


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


# ---------------------------------------------------------------------------
# API Pydantic Schemas
# ---------------------------------------------------------------------------


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    is_completed: bool = False


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_completed: bool | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None = None
    is_completed: bool
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    title: str
    content: str
    is_pinned: bool = False


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
