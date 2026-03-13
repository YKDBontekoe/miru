"""Tortoise ORM configuration and initialization."""

from __future__ import annotations

from tortoise import Tortoise

from app.core.config import get_settings
from app.infrastructure.database.utils import normalize_postgres_url

raw_url = normalize_postgres_url(get_settings().database_url or "", for_asyncpg=True)

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
