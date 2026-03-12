"""SQLModel database configuration and session management."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

# Use the DATABASE_URL from settings, but ensure it uses postgresql+asyncpg://
# for SQLAlchemy async support.
raw_url = get_settings().database_url or ""
if raw_url.startswith("postgres://"):
    db_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://"):
    db_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    db_url = raw_url

# asyncpg does NOT support 'sslmode' in the connection string.
# We must remove it if present to avoid TypeError.
if "sslmode=" in db_url:
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

    parsed = urlparse(db_url)
    query = parse_qs(parsed.query)
    query.pop("sslmode", None)
    new_query = urlencode(query, doseq=True)
    db_url = urlunparse(parsed._replace(query=new_query))

# Explicitly set SSL for asyncpg if enabled and it's a Supabase URL
connect_args = {}
if get_settings().database_ssl and ("supabase.co" in db_url or "pooler.supabase.com" in db_url):
    # For asyncpg, the parameter is 'ssl', not 'sslmode'
    connect_args["ssl"] = "require"

engine = create_async_engine(db_url, echo=False, future=True, connect_args=connect_args)


async def get_session() -> AsyncGenerator[AsyncSession]:
    """FastAPI dependency to provide an async database session."""
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """Initialize the database (create tables if they don't exist).

    Note: Since you use Supabase migrations, this is primarily for
    local testing or ensuring the schema matches our SQLModels.
    """
    async with engine.begin():
        # await conn.run_sync(SQLModel.metadata.create_all)
        pass
