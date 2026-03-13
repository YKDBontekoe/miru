"""Database utility functions."""

from __future__ import annotations


def normalize_postgres_url(url: str, for_asyncpg: bool = False) -> str:
    """Normalize a PostgreSQL connection string.

    Converts "postgresql://" scheme to "postgres://" to ensure compatibility
    with internal components.

    If `for_asyncpg` is True, appends `statement_cache_size=0` to the URL
    to bypass prepared statement caching issues with PgBouncer/Supabase.
    """
    if not url:
        return url

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgres://", 1)

    if for_asyncpg and url.startswith("postgres://") and "statement_cache_size=0" not in url:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}statement_cache_size=0"

    return url
