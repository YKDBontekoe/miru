"""SQLModel database configuration and session management."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings

# Use the DATABASE_URL from settings, but replace postgres:// with postgresql+asyncpg://
# for SQLAlchemy async support.
db_url = get_settings().database_url.replace("postgres://", "postgresql+asyncpg://")

engine = create_async_engine(db_url, echo=False, future=True)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency to provide an async database session."""
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """Initialize the database (create tables if they don't exist).
    
    Note: Since you use Supabase migrations, this is primarily for 
    local testing or ensuring the schema matches our SQLModels.
    """
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.create_all)
        pass
