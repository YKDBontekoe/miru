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

engine = create_async_engine(db_url, echo=False, future=True)


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
