"""Chat domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel
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
            "CREATE POLICY chat_rooms_member_select ON public.chat_rooms FOR SELECT USING (EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY chat_rooms_member_update ON public.chat_rooms FOR UPDATE USING (EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')"
            "));",
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
            "CREATE POLICY chat_messages_member_select ON public.chat_messages "
            "FOR SELECT USING (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY chat_messages_member_insert ON public.chat_messages "
            "FOR INSERT WITH CHECK (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member')"
            "));",
            "CREATE POLICY chat_messages_owner_update ON public.chat_messages "
            "FOR UPDATE USING (user_id = auth.uid());",
            "CREATE POLICY chat_messages_owner_delete ON public.chat_messages "
            "FOR DELETE USING (user_id = auth.uid() OR EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
        ]


class ChatRoomMember(SupabaseModel):
    """Junction table for Chat Rooms and Users (Members)."""

    id: UUID = fields.UUIDField(primary_key=True)
    room: fields.ForeignKeyRelation[ChatRoom] = fields.ForeignKeyField(
        "models.ChatRoom", related_name="members", on_delete=fields.CASCADE
    )
    user_id: UUID = fields.UUIDField(db_index=True)
    role: str = fields.CharField(max_length=50, default="member")  # type: ignore[assignment]
    joined_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "chat_room_members"
        unique_together = (("room", "user_id"),)
        sql_policies = [
            "ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY chat_room_members_select ON public.chat_room_members "
            "FOR SELECT USING (user_id = auth.uid() OR EXISTS ("
            "SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY chat_room_members_manage ON public.chat_room_members "
            "FOR ALL USING (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid() AND crm.role IN ('owner', 'admin')"
            "));",
        ]


class RoomInvitation(SupabaseModel):
    """Invitations to join a Chat Room."""

    id: UUID = fields.UUIDField(primary_key=True)
    room: fields.ForeignKeyRelation[ChatRoom] = fields.ForeignKeyField(
        "models.ChatRoom", related_name="invitations", on_delete=fields.CASCADE
    )
    inviter_id: UUID = fields.UUIDField(db_index=True)
    email: str | None = fields.CharField(max_length=255, null=True)  # type: ignore[assignment]
    token: str = fields.CharField(max_length=255, unique=True)  # type: ignore[assignment]
    role: str = fields.CharField(max_length=50, default="member")  # type: ignore[assignment]
    expires_at: datetime = fields.DatetimeField()
    accepted_at: datetime | None = fields.DatetimeField(null=True)
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "room_invitations"
        sql_policies = [
            "ALTER TABLE public.room_invitations ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY room_invitations_select ON public.room_invitations "
            "FOR SELECT USING (inviter_id = auth.uid() OR EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = room_invitations.room_id AND user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
            "CREATE POLICY room_invitations_insert ON public.room_invitations "
            "FOR INSERT WITH CHECK (inviter_id = auth.uid() AND (EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = room_invitations.room_id AND user_id = auth.uid() AND role IN ('owner', 'admin')"
            ")));",
            "CREATE POLICY room_invitations_update ON public.room_invitations "
            "FOR UPDATE USING (inviter_id = auth.uid() OR EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "));",
        ]


class ActivityLog(SupabaseModel):
    """Audit/activity feed for chat rooms and productivity items."""

    id: UUID = fields.UUIDField(primary_key=True)
    room: fields.ForeignKeyRelation[ChatRoom] | None = fields.ForeignKeyField(
        "models.ChatRoom", related_name="activity_logs", on_delete=fields.CASCADE, null=True
    )
    user_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    agent_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    action_type: str = fields.CharField(max_length=100)  # type: ignore[assignment]
    entity_type: str = fields.CharField(max_length=50)  # type: ignore[assignment]
    entity_id: UUID | None = fields.UUIDField(null=True)
    details: dict = fields.JSONField(default={})
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "activity_logs"
        sql_policies = [
            "ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY activity_logs_select ON public.activity_logs "
            "FOR SELECT USING (user_id = auth.uid() OR (room_id IS NOT NULL AND (EXISTS ("
            "SELECT 1 FROM chat_room_members WHERE room_id = activity_logs.room_id AND user_id = auth.uid()"
            ") OR EXISTS ("
            "SELECT 1 FROM chat_rooms WHERE id = room_id AND user_id = auth.uid()"
            "))));",
            "CREATE POLICY activity_logs_insert ON public.activity_logs "
            "FOR INSERT WITH CHECK (user_id = auth.uid());",
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


class RoomMemberResponse(BaseModel):
    id: UUID
    room_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime


class RoomInvitationCreate(BaseModel):
    email: str | None = None
    role: str = "member"


class RoomInvitationResponse(BaseModel):
    id: UUID
    room_id: UUID
    inviter_id: UUID
    email: str | None = None
    role: str
    expires_at: datetime
    accepted_at: datetime | None = None
    created_at: datetime


class ActivityLogResponse(BaseModel):
    id: UUID
    room_id: UUID | None = None
    user_id: UUID | None = None
    agent_id: UUID | None = None
    action_type: str
    entity_type: str
    entity_id: UUID | None = None
    details: dict
    created_at: datetime
