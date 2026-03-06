"""Supabase client initialization."""

from __future__ import annotations

from supabase import Client, create_client

from app.config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the initialized Supabase client (singleton)."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key,
        )
    return _supabase
