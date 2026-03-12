"""Neo4j graph database client for storing memory relationships."""

from __future__ import annotations

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.core.config import get_settings

_driver: AsyncDriver | None = None


async def get_neo4j_driver() -> AsyncDriver:
    """Return the Neo4j driver singleton."""
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            get_settings().neo4j_uri,
            auth=(get_settings().neo4j_user, get_settings().neo4j_password),
        )
    return _driver


async def close_neo4j_driver() -> None:
    """Close the Neo4j driver connection."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
