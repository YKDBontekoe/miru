"""Tortoise ORM configuration and initialization."""

from __future__ import annotations

import urllib.parse

from tortoise import Tortoise

from app.core.config import get_settings

settings = get_settings()
raw_url = settings.database_url or ""
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgres://", 1)

if raw_url.startswith("postgres://"):
    parsed = urllib.parse.urlsplit(raw_url)
    query_params = urllib.parse.parse_qsl(parsed.query)
    query_params = [(k, v) for k, v in query_params if k != "pgbouncer"]
    if not any(k == "statement_cache_size" for k, v in query_params):
        query_params.append(("statement_cache_size", "0"))

    # Note: search_path cannot be passed as a connection parameter to asyncpg.
    # Schema is set after connection establishment in init_db()

    new_query = urllib.parse.urlencode(query_params)
    raw_url = urllib.parse.urlunsplit(
        (parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment)
    )

# Database configuration for Tortoise and Aerich
TORTOISE_ORM = {
    "connections": {"default": raw_url},
    "apps": {
        "models": {
            "models": [
                "app.domain.agents.models",
                "app.domain.auth.models",
                "app.infrastructure.database.models.chat_models",
                "app.domain.memory.models",
                "app.domain.agent_tools.models",
                "app.domain.productivity.models",
                "aerich.models",
            ],
            "default_connection": "default",
        }
    },
    "use_tz": True,
    "timezone": "UTC",
}


async def init_db() -> None:
    """Initialize Tortoise ORM."""
    if Tortoise._inited:
        return

    settings = get_settings()
    # For PR previews or isolated environments, ensure the schema exists
    if settings.db_schema and settings.db_schema != "public":
        # Initial initialization to get a connection
        await Tortoise.init(config=TORTOISE_ORM)
        conn = Tortoise.get_connection("default")

        # Create schema if it doesn't exist and set it as the search path
        await conn.execute_script(f"CREATE SCHEMA IF NOT EXISTS {settings.db_schema}")
        await conn.execute_script(f"SET search_path TO {settings.db_schema}, public")

        # If we are in a PR environment (schema starts with pr_), we want a fresh start
        if settings.db_schema.startswith("pr_"):
            # Drop all tables in this schema and recreate them
            await Tortoise._drop_databases()

            # Use Aerich to run migrations
            from aerich import Command

            command = Command(tortoise_config=TORTOISE_ORM, app="models")
            await command.init()
            await command.upgrade(run_in_transaction=True)

            # Set search path after reconnection
            conn = Tortoise.get_connection("default")
            await conn.execute_script(f"SET search_path TO {settings.db_schema}, public")

            # Seed the test user for integration tests
            if settings.test_user_id:
                conn = Tortoise.get_connection("default")
                await conn.execute_script(f"""
                    INSERT INTO profiles (id, display_name, bio)
                    VALUES ('{settings.test_user_id}', 'Test User', 'Automated test account for CI/CD')
                    ON CONFLICT (id) DO NOTHING;
                    """)
        else:
            # For other non-public schemas, just ensure tables exist
            await Tortoise.generate_schemas()
    else:
        await Tortoise.init(config=TORTOISE_ORM)
        # Note: For production, we use migrations.
        # await Tortoise.generate_schemas()


async def close_db() -> None:
    """Close Tortoise ORM connections."""
    await Tortoise.close_connections()
