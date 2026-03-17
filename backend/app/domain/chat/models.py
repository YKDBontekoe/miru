"""Chat domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, Field
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel

if TYPE_CHECKING:
    from app.domain.agents.models import Agent


class ChatRoom(SupabaseModel):
    """Database entity for Chat Rooms."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    name: str = fields.CharField(max_length=255)  # type: ignore[assignment]
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
    user_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    agent_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    content: str = fields.TextField()
    message_type: str = fields.CharField(max_length=50, default="text")  # type: ignore[assignment]
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
    agent: fields.ForeignKeyRelation[Agent] = fields.ForeignKeyField(
        "models.Agent", related_name="agent_rooms", on_delete=fields.CASCADE
    )
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

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


class SignalRNegotiateResponse(BaseModel):
    url: str
    access_token: str = Field(alias="accessToken")
