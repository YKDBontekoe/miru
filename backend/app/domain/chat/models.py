"""Chat domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class ChatRoom(SupabaseModel):
    """Database entity for Chat Rooms."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
    name = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "chat_rooms"
        sql_policies = [
            "ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY chat_rooms_owner_all ON public.chat_rooms FOR ALL USING (auth.uid() = user_id);",
        ]


class ChatMessage(SupabaseModel):
    """Database entity for Chat Messages."""

    id = fields.UUIDField(primary_key=True)
    room = fields.ForeignKeyField(
        "models.ChatRoom", related_name="messages", on_delete=fields.CASCADE
    )
    user_id = fields.UUIDField(null=True, db_index=True)
    agent_id = fields.UUIDField(null=True, db_index=True)
    content = fields.TextField()
    message_type = fields.CharField(max_length=50, default="text")
    attachments = fields.JSONField(default=[])

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "chat_messages"
        sql_policies = [
            "ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY chat_messages_owner_select ON public.chat_messages "
            "FOR SELECT USING (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
        ]


class ChatRoomAgent(SupabaseModel):
    """Junction table for Chat Rooms and Agents."""

    room = fields.ForeignKeyField(
        "models.ChatRoom", related_name="room_agents", on_delete=fields.CASCADE
    )
    agent = fields.ForeignKeyField(
        "models.Agent", related_name="agent_rooms", on_delete=fields.CASCADE
    )
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "chat_room_agents"
        unique_together = (("room", "agent"),)


# ---------------------------------------------------------------------------
# API Pydantic Schemas
# ---------------------------------------------------------------------------


class RoomCreate(BaseModel):
    name: str


class RoomUpdate(BaseModel):
    name: str


class AddAgentToRoom(BaseModel):
    agent_id: UUID


class RoomResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime


class ChatMessageResponse(BaseModel):
    id: UUID
    room_id: UUID
    user_id: UUID | None = None
    agent_id: UUID | None = None
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    message: str | None = None
    content: str | None = None
    use_crew: bool = False
