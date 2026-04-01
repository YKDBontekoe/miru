"""Tortoise ORM configuration and initialization."""

from __future__ import annotations

import urllib.parse

from app.core.config import get_settings
from tortoise import Tortoise

raw_url = get_settings().database_url or ""
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgres://", 1)

if raw_url.startswith("postgres://"):
    parsed = urllib.parse.urlsplit(raw_url)
    query_params = urllib.parse.parse_qsl(parsed.query)

    # asyncpg expects "schema" instead of "search_path" as a connection URL parameter.
    # Passing "search_path" directly causes TypeError: connect() got an unexpected keyword argument
    filtered_params = []
    for k, v in query_params:
        if k == "pgbouncer":
            continue
        if k == "search_path":
            filtered_params.append(("schema", v))
        else:
            filtered_params.append((k, v))

    if not any(k == "statement_cache_size" for k, v in filtered_params):
        filtered_params.append(("statement_cache_size", "0"))

    new_query = urllib.parse.urlencode(filtered_params)
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
    await Tortoise.init(config=TORTOISE_ORM)
    # Note: For production, we use migrations.
    # For local dev/testing, we can use generate_schemas()
    # await Tortoise.generate_schemas()


async def close_db() -> None:
    """Close Tortoise ORM connections."""
    await Tortoise.close_connections()
