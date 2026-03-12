"""SQLModel database configuration and session management."""

from __future__ import annotations

from typing import TYPE_CHECKING
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

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

# Parse the URL to safely check hostnames and modify query parameters
parsed_url = urlparse(db_url)

# asyncpg does NOT support 'sslmode' in the connection string.
# We must remove it if present to avoid TypeError.
if parsed_url.query and "sslmode" in parse_qs(parsed_url.query):
    query = parse_qs(parsed_url.query)
    query.pop("sslmode", None)
    new_query = urlencode(query, doseq=True)
    parsed_url = parsed_url._replace(query=new_query)
    db_url = urlunparse(parsed_url)

# Explicitly set SSL for asyncpg if enabled and it's a Supabase URL
connect_args = {}
host = parsed_url.hostname or ""

# Check if the host ends with supabase.co or pooler.supabase.com securely
is_supabase_host = (
    host.endswith(".supabase.co")
    or host == "supabase.co"
    or host.endswith(".pooler.supabase.com")
    or host == "pooler.supabase.com"
)

if get_settings().database_ssl and is_supabase_host:
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
