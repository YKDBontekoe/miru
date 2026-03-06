"""Async PostgreSQL connection pool via asyncpg."""

from __future__ import annotations

import asyncpg
from pgvector.asyncpg import register_vector

from app.config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=2,
            max_size=10,
            init=_init_connection,
        )
    return _pool


async def _init_connection(conn: asyncpg.Connection) -> None:
    """Register pgvector codec for every new connection."""
    await register_vector(conn)


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
