"""Tests for JWT authentication middleware."""

from __future__ import annotations

import time
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient  # noqa: TC002

from app.infrastructure.database.supabase import get_supabase
from app.main import app
from tests.conftest import make_jwt

# ---------------------------------------------------------------------------
# decode_supabase_jwt unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""
    from app.auth import decode_supabase_jwt

    user_id = str(uuid4())
    token = make_jwt(user_id=user_id)
    payload = await decode_supabase_jwt(token)

    assert payload["sub"] == user_id
    assert payload["role"] == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises HTTPException 401."""
    from fastapi import HTTPException

    from app.auth import decode_supabase_jwt

    token = make_jwt(expired=True)
    with pytest.raises(HTTPException) as exc_info:
        await decode_supabase_jwt(token)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_decode_tampered_jwt_raises_401() -> None:
    """A JWT signed with a different secret raises HTTPException 401."""
    import jwt
    from fastapi import HTTPException

    from app.auth import decode_supabase_jwt

    payload = {"sub": str(uuid4()), "role": "authenticated", "exp": int(time.time()) + 3600}
    bad_token = jwt.encode(payload, "wrong-secret", algorithm="HS256")

    with pytest.raises(HTTPException) as exc_info:
        await decode_supabase_jwt(bad_token)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_decode_garbage_token_raises_401() -> None:
    """A completely malformed token raises HTTPException 401."""
    from fastapi import HTTPException

    from app.auth import decode_supabase_jwt

    with pytest.raises(HTTPException) as exc_info:
        await decode_supabase_jwt("not.a.jwt")

    assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# Integration tests — protected endpoint behaviour
# ---------------------------------------------------------------------------


def test_chat_requires_auth(client: TestClient) -> None:
    """POST /api/chat without a token returns 403 (HTTPBearer returns 403 for missing)."""
    response = client.post("/api/chat", json={"message": "hello"})
    assert response.status_code in (401, 403)


def test_memories_requires_auth(client: TestClient) -> None:
    """GET /api/memories without a token returns 403."""
    response = client.get("/api/memories")
    assert response.status_code in (401, 403)


def test_invalid_token_returns_401(client: TestClient) -> None:
    """A malformed Bearer token returns 401."""
    response = client.get(
        "/api/memories",
        headers={"Authorization": "Bearer garbage.token.here"},
    )
    assert response.status_code == 401


def test_expired_token_returns_401(client: TestClient) -> None:
    """An expired Bearer token returns 401."""
    token = make_jwt(expired=True)
    response = client.get(
        "/api/memories",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


@patch("app.routes.retrieve_memories", return_value=[])
def test_valid_token_passes_auth(
    mock_retrieve: MagicMock,
    client: TestClient,
    test_user_id: str,
    authed_headers: dict[str, str],
) -> None:
    """A valid Bearer token reaches the route handler (no 401/403)."""
    # Mock Supabase to return an empty list for memories.
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = []  # fmt: skip

    app.dependency_overrides[get_supabase] = lambda: mock_supabase

    response = client.get("/api/memories", headers=authed_headers)
    # 200 = auth passed (even if Supabase is mocked empty)
    assert response.status_code == 200


def test_health_endpoint_requires_no_auth(client: TestClient) -> None:
    """GET /health is public and does not require authentication."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
