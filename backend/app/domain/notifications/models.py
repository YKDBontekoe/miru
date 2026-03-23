"""Notification domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class DeviceToken(SupabaseModel):
    """Stores push notification device tokens for users."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    token: str = fields.CharField(max_length=512, unique=True, db_index=True)  # type: ignore[assignment]
    platform: str = fields.CharField(max_length=50)  # type: ignore[assignment]
    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "device_tokens"
        # RLS policies: users can only select and manage their own tokens
        sql_policies = [
            "ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY device_tokens_owner_all ON public.device_tokens FOR ALL USING (auth.uid() = user_id);",
        ]


# ---------------------------------------------------------------------------
# API Pydantic Schemas
# ---------------------------------------------------------------------------


class DeviceTokenCreate(BaseModel):
    """Schema for registering a new device token."""

    token: str
    platform: str

    model_config = ConfigDict(extra="ignore")


class DeviceTokenResponse(BaseModel):
    """Schema for returning a device token."""

    id: UUID
    user_id: UUID
    token: str
    platform: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
