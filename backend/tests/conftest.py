"""Pytest configuration and shared fixtures."""

from __future__ import annotations

import os
import time
from collections.abc import AsyncGenerator
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import jwt
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from tortoise import Tortoise

if TYPE_CHECKING:
    from collections.abc import Generator

# ---------------------------------------------------------------------------
# Required env vars — set before importing the app so Settings initialises.
# ---------------------------------------------------------------------------

os.environ.setdefault("OPENROUTER_API_KEY", "test-key")
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-that-is-long-enough-32ch")

os.environ.setdefault("DEFAULT_CHAT_MODEL", "google/gemma-3-27b-it:free")
os.environ.setdefault("EMBEDDING_MODEL", "openai/text-embedding-3-small")
os.environ.setdefault("WEBAUTHN_RP_ID", "localhost")
os.environ.setdefault("WEBAUTHN_RP_NAME", "Miru Test")
os.environ.setdefault("WEBAUTHN_EXPECTED_ORIGIN", "http://localhost")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "*")

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]
_JWT_ALGORITHM = "HS256"


def make_jwt(user_id: str | None = None, expired: bool = False) -> str:
    """Create a Supabase-style JWT for testing.

    Args:
        user_id: The user UUID to embed as the ``sub`` claim.
                 Defaults to a random UUID.
        expired: If True, set ``exp`` in the past.
    """
    uid = user_id or str(uuid4())
    now = int(time.time())
    exp = now - 3600 if expired else now + 3600
    payload: dict[str, Any] = {
        "sub": uid,
        "role": "authenticated",
        "iss": "supabase",
        "iat": now,
        "exp": exp,
        "aud": "authenticated",
    }
    return str(jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM))


def auth_headers(user_id: str | None = None) -> dict[str, str]:
    """Return HTTP headers with a valid Bearer token for the given user."""
    return {"Authorization": f"Bearer {make_jwt(user_id=user_id)}"}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def postgres_container() -> Generator[Any, None, None]:
    """Provide a PostgreSQL testcontainer with pgvector."""
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        yield postgres


@pytest_asyncio.fixture(autouse=True)
async def initialize_tortoise(
    request: pytest.FixtureRequest,
) -> AsyncGenerator[None, None]:
    # We use SQLite for regular tests, but integration tests can opt into Postgres
    # by using the testcontainer fixture. Let's inspect markers or use a specific
    # connection string if provided.

    # We look for a marker 'integration' or default to sqlite
    is_integration = request.node.get_closest_marker("integration")

    if is_integration:
        # Fallback to local postgres if container fails, or assume it is running
        # normally, but given environment issues we'll use a local db connection string if available
        # or skip testcontainer startup logic and rely on local db / SQLite if needed
        import os
        db_url = os.environ.get("TEST_DATABASE_URL")
        if not db_url:
            try:
                container = request.getfixturevalue("postgres_container")
                db_url = container.get_connection_url().replace("postgresql+psycopg2://", "postgres://")
            except Exception:
                db_url = "sqlite://:memory:"
                # If we fallback to SQLite, we must skip integration tests entirely because
                # they rely on Postgres-specific pgvector and RPC syntaxes (`:= $1::vector`).
                pytest.skip("PostgreSQL testcontainer could not start; skipping pgvector integration test.")
                is_integration = False
    else:
        db_url = "sqlite://:memory:"

    config = {
        "connections": {"default": db_url},
        "apps": {
            "models": {
                "models": [
                    "app.domain.agents.models",
                    "app.infrastructure.database.models.chat_models",
                    "app.domain.memory.models",
                    "app.domain.agent_tools.models",
                    "app.infrastructure.database.models.auth_models",
                    "app.domain.productivity.models",
                ],
                "default_connection": "default",
            }
        },
    }

    # Fast-fail trick to avoid keyerror issue when the .env is overriding config
    # in tortoise tests.
    import os
    db_url_env = os.environ.get("DATABASE_URL")
    if "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]

    await Tortoise.init(config=config)

    if is_integration:
        # Create pgvector extension on the container database
        conn = Tortoise.get_connection("default")
        await conn.execute_query("CREATE EXTENSION IF NOT EXISTS vector;")

    await Tortoise.generate_schemas()

    if is_integration:
        # Create match_memories function to make tests work
        from app.domain.memory.models import MemoryCollection
        sql_functions = MemoryCollection.Meta.sql_functions
        conn = Tortoise.get_connection("default")
        for func in sql_functions:
            await conn.execute_query(func)

    yield
    await Tortoise.close_connections()

    if db_url_env:
        os.environ["DATABASE_URL"] = db_url_env



@pytest.fixture()
def client() -> Generator[TestClient]:
    """Return a test client for the FastAPI app."""
    from app.main import app

    app.dependency_overrides = {}
    yield TestClient(app, raise_server_exceptions=True)
    app.dependency_overrides = {}


@pytest.fixture()
def test_user_id() -> Any:
    """A stable UUID used as the authenticated user in tests."""
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture()
def authed_headers(test_user_id: Any) -> dict[str, str]:
    """Authorization headers for the test user."""
    return auth_headers(user_id=test_user_id)
