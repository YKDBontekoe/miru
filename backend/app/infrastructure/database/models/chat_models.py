"""Chat domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class ChatRoom(SupabaseModel):
    """Database entity for Chat Rooms."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    name = fields.CharField(max_length=255)
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "chat_rooms"
        sql_policies = [
            "ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY chat_rooms_owner_all ON public.chat_rooms FOR ALL USING (auth.uid() = user_id);",
        ]


class ChatMessage(SupabaseModel):
    """Database entity for Chat Messages."""

    id: UUID = fields.UUIDField(primary_key=True)
    room: fields.ForeignKeyRelation[ChatRoom] = fields.ForeignKeyField(
        "models.ChatRoom", related_name="messages", on_delete=fields.CASCADE
    )
    room_id: UUID  # Tortoise ORM FK column accessor
    user_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    agent_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    content: str = fields.TextField()
    message_type = fields.CharField(max_length=50, default="text")
    attachments: list = fields.JSONField(default=[])

    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "chat_messages"
        sql_policies = [
            "ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY chat_messages_owner_select ON public.chat_messages "
            "FOR SELECT USING (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY chat_messages_owner_insert ON public.chat_messages "
            "FOR INSERT WITH CHECK (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY chat_messages_owner_update ON public.chat_messages "
            "FOR UPDATE USING (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY chat_messages_owner_delete ON public.chat_messages "
            "FOR DELETE USING (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
        ]


class ChatRoomAgent(SupabaseModel):
    """Junction table for Chat Rooms and Agents."""

    room: fields.ForeignKeyRelation[ChatRoom] = fields.ForeignKeyField(
        "models.ChatRoom", related_name="room_agents", on_delete=fields.CASCADE
    )
    room_id: UUID  # Tortoise ORM FK column accessor
    agent: fields.ForeignKeyRelation[Any] = fields.ForeignKeyField(
        "models.Agent", related_name="agent_rooms", on_delete=fields.CASCADE
    )
    agent_id: UUID  # Tortoise ORM FK column accessor
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "chat_room_agents"
        unique_together = (("room", "agent"),)
