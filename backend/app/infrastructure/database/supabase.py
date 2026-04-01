"""Supabase client initialization."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import Depends

from app.core.config import get_settings

if TYPE_CHECKING:
    from supabase import Client
else:
    Client = Any

_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the initialized Supabase client (singleton).

    This function acts as a FastAPI dependency.
    """
    global _supabase
    if _supabase is None:
        from supabase import create_client

        settings = get_settings()
        _supabase = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key,
        )
    return _supabase


# Convenience type alias for route signatures.
SupabaseClient = Annotated[Client, Depends(get_supabase)]
