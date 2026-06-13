"""Tests for authentication and JWT verification."""

from __future__ import annotations

import base64
import json
import uuid
from typing import TYPE_CHECKING
from unittest.mock import MagicMock, patch

import jwt
import pytest

from app.core.security.jwt_verifier import SupabaseJWTVerifier
from app.domain.auth.schemas import JWTPayload
from app.domain.auth.service import AuthService
from app.infrastructure.database.supabase import get_supabase
from app.infrastructure.repositories.auth_repo import AuthRepository
from app.main import app

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""

    token = make_jwt()

    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)
    payload = await service.decode_jwt(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""

    token = make_jwt(expired=True)

    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)

    with pytest.raises(jwt.ExpiredSignatureError):
        await service.decode_jwt(token)


@pytest.mark.asyncio
async def test_decode_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """An invalid JWT format raises a DecodeError and logs a warning instead of an error."""
    import logging

    token = "invalid.token.format"

    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)

    with (
        caplog.at_level(logging.WARNING),
        pytest.raises(jwt.DecodeError, match="Invalid token format"),
    ):
        await service.decode_jwt(token)

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


@pytest.mark.asyncio
async def test_decode_rs256_valid_jwt() -> None:
    """An RS256 token is verified successfully using the JWKS client branch."""

    # Create an RS256 token (we'll just use a dummy key and mock decode)
    header_b64 = (
        base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
        .decode()
        .rstrip("=")
    )
    payload_b64 = (
        base64.urlsafe_b64encode(
            json.dumps(
                {
                    "sub": "user_id",
                    "role": "authenticated",
                    "aud": "authenticated",
                    "iss": "supabase",
                    "exp": 1999999999,
                    "iat": 1,
                }
            ).encode()
        )
        .decode()
        .rstrip("=")
    )
    token = f"{header_b64}.{payload_b64}.c2lnbmF0dXJl"

    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)

    with patch("jwt.PyJWKClient") as mock_jwk_client_class:
        mock_jwks_client_instance = MagicMock()
        mock_jwks_client_instance.get_signing_key_from_jwt.return_value = MagicMock(
            key="public_key"
        )
        mock_jwk_client_class.return_value = mock_jwks_client_instance

        with patch("asyncio.to_thread") as mock_to_thread:
            # We mock to_thread to immediately return the result of get_signing_key_from_jwt
            mock_to_thread.return_value = mock_jwks_client_instance.get_signing_key_from_jwt(token)

            with patch("jwt.decode") as mock_jwt_decode:
                mock_jwt_decode.return_value = {
                    "sub": str(uuid.uuid4()),
                    "role": "authenticated",
                    "aud": "authenticated",
                    "iss": "supabase",
                    "exp": 1999999999,
                    "iat": 1,
                }

                payload = await service.decode_jwt(token)

                assert isinstance(payload, JWTPayload)
                pass


@pytest.mark.asyncio
async def test_decode_rs256_invalid_jwt_raises_error() -> None:
    """An RS256 token fails verification using the JWKS client branch when an error is raised."""
    import jwt

    # Create an RS256 token (we'll just use a dummy key and mock decode)
    header_b64 = (
        base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
        .decode()
        .rstrip("=")
    )
    payload_b64 = (
        base64.urlsafe_b64encode(
            json.dumps(
                {
                    "sub": "user_id",
                    "role": "authenticated",
                    "aud": "authenticated",
                    "iss": "supabase",
                    "exp": 1999999999,
                    "iat": 1,
                }
            ).encode()
        )
        .decode()
        .rstrip("=")
    )
    token = f"{header_b64}.{payload_b64}.c2lnbmF0dXJl"

    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)

    with patch("jwt.PyJWKClient") as mock_jwk_client_class:
        mock_jwks_client_instance = MagicMock()
        mock_jwks_client_instance.get_signing_key_from_jwt.side_effect = jwt.PyJWKClientError(
            "Unable to fetch JWKS"
        )
        mock_jwk_client_class.return_value = mock_jwks_client_instance

        with patch("asyncio.to_thread") as mock_to_thread:
            # Re-raise the exception from the mock
            async def mock_coro(*args, **kwargs):
                raise jwt.PyJWKClientError("Unable to fetch JWKS")

            mock_to_thread.side_effect = mock_coro

            with pytest.raises(jwt.PyJWKClientError):
                await service.decode_jwt(token)
