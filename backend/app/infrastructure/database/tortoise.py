"""Tortoise ORM configuration and initialization."""

import urllib.parse

from tortoise import Tortoise

from app.core.config import get_settings

raw_url = get_settings().database_url or ""

if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgres://", 1)

if raw_url.startswith("postgres://"):
    parsed = urllib.parse.urlparse(raw_url)
    query = dict(urllib.parse.parse_qsl(parsed.query))

    # Remove pgbouncer argument as it's not supported by asyncpg
    query.pop("pgbouncer", None)

    # Disable prepared statement caching to avoid InvalidSQLStatementNameError
    # when using PgBouncer in transaction mode
    query["statement_cache_size"] = "0"

    parsed = parsed._replace(query=urllib.parse.urlencode(query))
    raw_url = urllib.parse.urlunparse(parsed)

# Database configuration for Tortoise and Aerich
TORTOISE_ORM = {
    "connections": {"default": raw_url},
    "apps": {
        "models": {
            "models": [
                "app.domain.agents.models",
                "app.domain.auth.models",
                "app.domain.chat.models",
                "app.domain.memory.models",
                "app.domain.agent_tools.models",
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
    await Tortoise.init(config=TORTOISE_ORM)
    # Note: For production, we use migrations.
    # For local dev/testing, we can use generate_schemas()
    # await Tortoise.generate_schemas()


async def close_db() -> None:
    """Close Tortoise ORM connections."""
    await Tortoise.close_connections()
