"""Auth domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class Profile(SupabaseModel):
    """User profile extension for auth.users."""

    id = fields.UUIDField(primary_key=True)  # References auth.users(id)
    display_name = fields.CharField(max_length=255, null=True)
    avatar_url = fields.CharField(max_length=512, null=True)
    bio = fields.TextField(null=True)
    timezone = fields.CharField(max_length=50, default="UTC")
    theme_preference = fields.CharField(max_length=20, default="system")
    privacy_mode = fields.BooleanField(default=False)
    notifications_enabled = fields.BooleanField(default=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "profiles"
        sql_policies = [
            "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);",
            "CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);",
        ]
        sql_functions = [
            """
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger AS $$
            BEGIN
              INSERT INTO public.profiles (id, display_name, avatar_url)
              VALUES (
                new.id,
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'avatar_url'
              );
              RETURN new;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            """,
            """
            CREATE OR REPLACE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            """,
        ]


class Passkey(SupabaseModel):
    """WebAuthn passkeys for passwordless login."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID = fields.UUIDField(db_index=True)
    credential_id: str = fields.CharField(max_length=512, db_index=True)  # type: ignore[assignment]
    public_key: str = fields.TextField()
    sign_count: int = fields.IntField(default=0)
    device_name: str | None = fields.CharField(max_length=255, null=True)  # type: ignore[assignment]
    transports: list[str] = fields.JSONField(default=[])
    last_used_at: datetime | None = fields.DatetimeField(null=True)
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "passkeys"
        sql_policies = [
            "ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY passkeys_owner_all ON public.passkeys FOR ALL USING (auth.uid() = user_id);",
        ]


# ---------------------------------------------------------------------------
# API Pydantic Schemas
# ---------------------------------------------------------------------------


class JWTPayload(BaseModel):
    """Structure of a Supabase-issued JWT."""

    sub: UUID
    email: str | None = None
    role: str | None = None
    exp: int
    iat: int
    aud: str | list[str] | None = None

    model_config = ConfigDict(extra="allow")


class PasskeyRecord(BaseModel):
    """Structure of a passkey database record."""

    id: UUID
    user_id: UUID
    credential_id: str
    public_key: str
    sign_count: int
    device_name: str | None = None
    transports: list[str] = Field(default_factory=list)
    last_used_at: datetime | None = None
    created_at: datetime


class PasskeyRegisterOptionsRequest(BaseModel):
    device_name: str | None = Field(default=None, max_length=255)


class PasskeyRegisterVerifyRequest(BaseModel):
    challenge_id: str = Field(max_length=255)
    credential: str = Field(max_length=4096)  # JSON-encoded PublicKeyCredential
    device_name: str | None = Field(default=None, max_length=255)


class PasskeyLoginOptionsRequest(BaseModel):
    email: str = Field(max_length=255)


class PasskeyLoginVerifyRequest(BaseModel):
    challenge_id: str = Field(max_length=255)
    credential: str = Field(max_length=4096)  # JSON-encoded PublicKeyCredential (assertion)
