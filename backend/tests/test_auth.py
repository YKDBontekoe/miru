"""Tests for authentication and JWT verification."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import jwt
import pytest

from app.domain.auth.schemas import JWTPayload
from app.infrastructure.database.supabase import get_supabase
from app.main import app

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_auth_service_decode_delegates() -> None:
    """AuthService delegates token decoding to the injected TokenVerifierProtocol."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    mock_verifier = AsyncMock()
    mock_payload = JWTPayload(
        sub=UUID("00000000-0000-0000-0000-000000000000"),
        role="authenticated",
        exp=9999999999,
        iat=1234567890,
    )
    mock_verifier.decode_token.return_value = mock_payload

    service = AuthService(AuthRepository(MagicMock()), mock_verifier)
    payload = await service.decode_jwt("dummy_token")

    assert payload == mock_payload
    mock_verifier.decode_token.assert_called_once_with("dummy_token")


@pytest.mark.asyncio
async def test_verifier_valid_jwt() -> None:
    """SupabaseJWTVerifier decodes a valid JWT successfully."""
    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    token = make_jwt()
    verifier = SupabaseJWTVerifier()
    payload = await verifier.decode_token(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_verifier_expired_jwt_raises() -> None:
    """SupabaseJWTVerifier raises an error for an expired JWT."""
    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    token = make_jwt(expired=True)
    verifier = SupabaseJWTVerifier()

    with pytest.raises(jwt.ExpiredSignatureError):
        await verifier.decode_token(token)


@pytest.mark.asyncio
async def test_verifier_unexpected_exception_logs_error(caplog: pytest.LogCaptureFixture) -> None:
    """SupabaseJWTVerifier handles unexpected Exceptions by logging an error and re-raising."""
    import logging
    from unittest.mock import patch

    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    verifier = SupabaseJWTVerifier()

    with (
        patch("jwt.get_unverified_header", side_effect=ValueError("Unexpected explosion")),
        caplog.at_level(logging.ERROR),
        pytest.raises(ValueError, match="Unexpected explosion"),
    ):
        await verifier.decode_token("some.token")

    assert any(
        record.levelname == "ERROR" and "Unexpected error during JWT validation" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_verifier_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """SupabaseJWTVerifier raises a DecodeError for invalid format and logs a warning."""
    import logging

    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    token = "invalid.token.format"
    verifier = SupabaseJWTVerifier()

    with (
        caplog.at_level(logging.WARNING),
        pytest.raises(jwt.DecodeError, match="Invalid token format"),
    ):
        await verifier.decode_token(token)

    assert any(
        record.levelname == "WARNING" and "JWT validation failed" in record.message
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
