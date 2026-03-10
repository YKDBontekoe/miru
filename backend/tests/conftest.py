"""Pytest configuration and shared fixtures."""

from __future__ import annotations

import os
import time
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from jose import jwt

# ---------------------------------------------------------------------------
# Required env vars — set before importing the app so Settings initialises.
# ---------------------------------------------------------------------------

os.environ.setdefault("OPENROUTER_API_KEY", "test-key")
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-that-is-long-enough-32ch")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("DEFAULT_CHAT_MODEL", "google/gemma-3-27b-it:free")
os.environ.setdefault("EMBEDDING_MODEL", "openai/text-embedding-3-small")
os.environ.setdefault("NEO4J_URI", "bolt://localhost:7687")
os.environ.setdefault("NEO4J_USER", "neo4j")
os.environ.setdefault("NEO4J_PASSWORD", "test-password")
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
    }
    return str(jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM))


def auth_headers(user_id: str | None = None) -> dict[str, str]:
    """Return HTTP headers with a valid Bearer token for the given user."""
    return {"Authorization": f"Bearer {make_jwt(user_id=user_id)}"}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def client() -> TestClient:
    """Return a test client for the FastAPI app."""
    from app.main import app

    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def test_user_id() -> Any:
    """A stable UUID used as the authenticated user in tests."""
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture()
def authed_headers(test_user_id: Any) -> dict[str, str]:
    """Authorization headers for the test user."""
    return auth_headers(user_id=test_user_id)
