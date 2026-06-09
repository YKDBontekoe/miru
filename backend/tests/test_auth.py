"""Tests for authentication and JWT verification."""

from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING
from unittest.mock import MagicMock, patch

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security.auth import SupabaseJWTVerifier, get_current_user
from app.domain.auth.schemas import JWTPayload
from app.infrastructure.database.supabase import get_supabase
from app.main import app

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""
    token = make_jwt()
    verifier = SupabaseJWTVerifier()
    payload = await verifier.verify_token(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""
    token = make_jwt(expired=True)
    verifier = SupabaseJWTVerifier()

    with pytest.raises(jwt.ExpiredSignatureError):
        await verifier.verify_token(token)


@pytest.mark.asyncio
async def test_decode_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """An invalid JWT format raises a DecodeError and logs a warning instead of an error."""
    token = "invalid.token.format"
    verifier = SupabaseJWTVerifier()

    with (
        caplog.at_level(logging.WARNING),
        pytest.raises(jwt.DecodeError, match="Invalid token format"),
    ):
        await verifier.verify_token(token)

    assert any(
        record.levelname == "WARNING" and "JWT validation failed" in record.message
        for record in caplog.records
    )
    assert not any(
        record.levelname == "ERROR" and "JWT validation failed" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_decode_es256_jwt_via_jwks() -> None:
    """An ES256 JWT uses PyJWKClient to fetch signing key."""
    token = make_jwt()

    with patch("jwt.get_unverified_header", return_value={"alg": "ES256"}), \
         patch("jwt.PyJWKClient.get_signing_key_from_jwt") as mock_get_key:

        mock_key = MagicMock()
        mock_key.key = "fake_key"
        mock_get_key.return_value = mock_key

        now = int(time.time())
        fake_payload = {
            "sub": "11111111-1111-1111-1111-111111111111",
            "role": "authenticated",
            "iat": now,
            "exp": now + 3600,
            "iss": "supabase",
            "aud": "authenticated"
        }
        with patch("jwt.decode", return_value=fake_payload):
            verifier = SupabaseJWTVerifier()
            payload = await verifier.verify_token(token)

            assert isinstance(payload, JWTPayload)
            assert str(payload.sub) == "11111111-1111-1111-1111-111111111111"


@pytest.mark.asyncio
async def test_decode_jwt_invalid_token_error(caplog: pytest.LogCaptureFixture) -> None:
    """jwt.InvalidTokenError is caught and logged."""
    token = make_jwt()
    verifier = SupabaseJWTVerifier()

    with patch("jwt.decode", side_effect=jwt.InvalidTokenError("bad token")), \
         caplog.at_level(logging.WARNING), \
         pytest.raises(jwt.InvalidTokenError):
        await verifier.verify_token(token)

    assert any("JWT validation failed: bad token" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_decode_jwt_jwks_error(caplog: pytest.LogCaptureFixture) -> None:
    """jwt.PyJWKClientError is caught and logged."""
    token = make_jwt()
    verifier = SupabaseJWTVerifier()

    with patch("jwt.get_unverified_header", return_value={"alg": "ES256"}), \
         patch("jwt.PyJWKClient.get_signing_key_from_jwt", side_effect=jwt.PyJWKClientError("jwks failure")), \
         caplog.at_level(logging.WARNING), \
         pytest.raises(jwt.PyJWKClientError):
        await verifier.verify_token(token)

    assert any("JWT JWKS validation failed: jwks failure" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_get_current_user_invalid_token() -> None:
    """get_current_user raises HTTPException on verification failure."""
    verifier = MagicMock()
    verifier.verify_token.side_effect = jwt.InvalidTokenError()

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad_token")

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=creds, token_verifier=verifier)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["error"] == "invalid_authentication_token"


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
