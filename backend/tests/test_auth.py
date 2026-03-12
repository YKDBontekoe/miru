"""Tests for authentication and JWT verification."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING
from uuid import uuid4

import jwt
import pytest

from app.domain.auth.models import JWTPayload

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


def make_jwt(user_id: str | None = None, expired: bool = False) -> str:
    """Create a dummy Supabase JWT for testing."""
    from app.core.config import get_settings

    settings = get_settings()
    uid = user_id or str(uuid4())
    now = int(time.time())
    payload = {
        "sub": uid,
        "role": "authenticated",
        "iat": now,
        "exp": now - 3600 if expired else now + 3600,
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""
    from unittest.mock import MagicMock

    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt()
    service = AuthService(AuthRepository(MagicMock()))
    payload = await service.decode_jwt(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""
    from unittest.mock import MagicMock

    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt(expired=True)
    service = AuthService(AuthRepository(MagicMock()))

    with pytest.raises(jwt.ExpiredSignatureError):
        await service.decode_jwt(token)


def test_memories_requires_auth(client: TestClient) -> None:
    """GET /api/v1/memory without a token returns 401."""
    response = client.get("/api/v1/memory")
    assert response.status_code in (401, 403)


def test_invalid_token_returns_401(client: TestClient) -> None:
    """A malformed Bearer token returns 401."""
    response = client.get(
        "/api/v1/memory",
        headers={"Authorization": "Bearer garbage.token.here"},
    )
    assert response.status_code == 401
