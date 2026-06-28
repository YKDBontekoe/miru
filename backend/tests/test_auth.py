"""Tests for authentication and JWT verification."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import jwt
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
    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    token = make_jwt()
    verifier = SupabaseJWTVerifier()
    payload = await verifier.verify_token(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_jwks_rs256_jwt() -> None:
    """A valid RS256 JWT fetches JWKS and decodes successfully."""
    from unittest.mock import patch

    from app.core.config import get_settings
    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    # Mock signing key setup
    mock_key = MagicMock()
    mock_key.key = get_settings().supabase_jwt_secret

    # Create token with RS256 alg in header but using HS256 for signing so the string is valid
    token = jwt.encode(
        {
            "sub": "12345678-1234-5678-1234-567812345678",
            "role": "authenticated",
            "aud": "authenticated",
        },
        mock_key.key,
        algorithm="HS256",
        headers={"kid": "test_kid"},
    )
    # forcefully overwrite the header in the token string for testing
    import base64
    import json

    header = {"alg": "RS256", "kid": "test_kid", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    parts = token.split(".")
    token = f"{header_b64}.{parts[1]}.{parts[2]}"
    # The jwt.decode logic requires the encoded string to match the decoded alg if we pass algorithms=["RS256"].
    # For testing, we mock PyJWKClient to return a key, and we use a workaround by mocking jwt.decode
    # to avoid needing a real RSA key pair in the test.

    verifier = SupabaseJWTVerifier()

    from time import time

    current_time = int(time())
    with (
        patch("jwt.PyJWKClient.get_signing_key_from_jwt", return_value=mock_key),
        patch(
            "jwt.decode",
            return_value={
                "sub": "12345678-1234-5678-1234-567812345678",
                "role": "authenticated",
                "iat": current_time,
                "exp": current_time + 3600,
            },
        ),
    ):
        payload = await verifier.verify_token(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""
    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

    token = make_jwt(expired=True)
    verifier = SupabaseJWTVerifier()

    with pytest.raises(jwt.ExpiredSignatureError):
        await verifier.verify_token(token)


@pytest.mark.asyncio
async def test_decode_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """An invalid JWT format raises a DecodeError and logs a warning instead of an error."""
    import logging

    from app.infrastructure.external.jwt_verifier import SupabaseJWTVerifier

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
