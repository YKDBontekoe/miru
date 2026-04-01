"""Auth domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from app.infrastructure.database.base import SupabaseModel
from tortoise import fields


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

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
    credential_id = fields.CharField(max_length=512, db_index=True)
    public_key = fields.TextField()
    sign_count = fields.IntField(default=0)
    device_name = fields.CharField(max_length=255, null=True)
    transports = fields.JSONField(default=[])
    last_used_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "passkeys"
        sql_policies = [
            "ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY passkeys_owner_all ON public.passkeys FOR ALL USING (auth.uid() = user_id);",
        ]
