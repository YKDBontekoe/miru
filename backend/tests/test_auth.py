"""Tests for authentication and JWT verification."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import pytest

from app.domain.auth.schemas import JWTPayload
from app.infrastructure.database.supabase import get_supabase
from app.main import app

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.auth.jwt_verifier import SupabaseJWTVerifier
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt()
    service = AuthService(AuthRepository(MagicMock()), SupabaseJWTVerifier())
    payload = await service.decode_jwt(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.auth.jwt_verifier import SupabaseJWTVerifier
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt(expired=True)
    service = AuthService(AuthRepository(MagicMock()), SupabaseJWTVerifier())

    with pytest.raises(ValueError, match="Invalid token: Signature has expired"):
        await service.decode_jwt(token)


@pytest.mark.asyncio
async def test_decode_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """An invalid JWT format raises a DecodeError and logs a warning instead of an error."""
    import logging

    from app.domain.auth.service import AuthService
    from app.infrastructure.auth.jwt_verifier import SupabaseJWTVerifier
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = "invalid.token.format"
    service = AuthService(AuthRepository(MagicMock()), SupabaseJWTVerifier())

    with (
        caplog.at_level(logging.WARNING),
        pytest.raises(ValueError, match="Invalid token: Invalid token format"),
    ):
        await service.decode_jwt(token)

@pytest.mark.asyncio
async def test_decode_unexpected_error_logs_exception(caplog: pytest.LogCaptureFixture, monkeypatch: pytest.MonkeyPatch) -> None:
    import logging

    from app.domain.auth.service import AuthService
    from app.infrastructure.auth.jwt_verifier import SupabaseJWTVerifier
    from app.infrastructure.repositories.auth_repo import AuthRepository

    # Mock run_in_executor to raise a generic Exception
    verifier = SupabaseJWTVerifier()

    # We must patch asyncio.get_running_loop().run_in_executor correctly.
    # The simplest way is to mock loop.run_in_executor on the object directly,
    # but `asyncio.get_running_loop` returns the current loop.
    import asyncio

    loop = asyncio.get_running_loop()

    async def mock_run_in_executor(*args, **kwargs):
        raise RuntimeError("Unexpected boom")

    monkeypatch.setattr(loop, "run_in_executor", mock_run_in_executor)

    service = AuthService(AuthRepository(MagicMock()), verifier)

    with (
        caplog.at_level(logging.ERROR),
        pytest.raises(RuntimeError, match="Unexpected boom"),
    ):
        await service.decode_jwt("some.token")

    assert any(
        record.levelname == "ERROR" and "Unexpected error during JWT validation" in record.message
        for record in caplog.records
    )
    assert not any(
        record.levelname == "ERROR" and "JWT validation failed" in record.message
        for record in caplog.records
    )


def test_memories_requires_auth(client: TestClient) -> None:
    """GET /api/v1/memory without a token returns 401."""
    app.dependency_overrides[get_supabase] = lambda: MagicMock()
    try:
        response = client.get("/api/v1/memory")
        assert response.status_code in (401, 403)
    finally:
        app.dependency_overrides = {}


def test_invalid_token_returns_401(client: TestClient) -> None:
    """A malformed Bearer token returns 401."""
    app.dependency_overrides[get_supabase] = lambda: MagicMock()
    try:
        response = client.get(
            "/api/v1/memory",
            headers={"Authorization": "Bearer garbage.token.here"},
        )
        assert response.status_code == 401
    finally:
        app.dependency_overrides = {}
