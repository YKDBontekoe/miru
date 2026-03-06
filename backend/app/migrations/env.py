"""Alembic environment configuration."""

from __future__ import annotations

import asyncio
from logging.config import fileConfig
from typing import TYPE_CHECKING

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import settings

if TYPE_CHECKING:
    from sqlalchemy.engine import Connection

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = None

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")


# Override sqlalchemy.url with our DATABASE_URL (if available)
# Otherwise fall back to supabase connection string format
def get_database_url() -> str:
    """Get database URL from settings."""
    # Check if we have a direct DATABASE_URL (for Supabase direct connection)
    if hasattr(settings, "database_url") and settings.database_url:
        return settings.database_url

    # Construct from Supabase URL if needed
    # Supabase provides a direct PostgreSQL connection string
    # Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    if hasattr(settings, "supabase_url") and settings.supabase_url:
        # Extract project ref from supabase_url
        # https://[project-ref].supabase.co -> db.[project-ref].supabase.co
        supabase_url = settings.supabase_url.replace("https://", "").replace(".supabase.co", "")
        # This is a placeholder - actual connection string should be in DATABASE_URL env var
        return f"postgresql://postgres:password@db.{supabase_url}.supabase.co:5432/postgres"

    raise ValueError("No database URL configured. Set DATABASE_URL or SUPABASE_URL.")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Execute migrations with the given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
