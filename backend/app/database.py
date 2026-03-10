"""Supabase client initialization."""

from __future__ import annotations

from supabase import Client, create_client

from app.config import get_settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the initialized Supabase client (singleton)."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            supabase_url=get_settings().supabase_url,
            supabase_key=get_settings().supabase_service_role_key,
        )
    return _supabase
