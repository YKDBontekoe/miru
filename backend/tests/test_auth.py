"""Tests for authentication and JWT verification."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import jwt
import pytest

from app.domain.auth.schemas import JWTPayload
from app.infrastructure.auth.jwt_verifier import SupabaseJWTVerifier
from app.infrastructure.database.supabase import get_supabase
from app.main import app

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt()
    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)
    payload = await service.decode_jwt(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt(expired=True)
    verifier = SupabaseJWTVerifier()
    service = AuthService(AuthRepository(MagicMock()), verifier)

    with pytest.raises(jwt.ExpiredSignatureError):
        await service.decode_jwt(token)


@pytest.mark.asyncio
async def test_decode_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """An invalid JWT format raises a DecodeError and logs a warning instead of an error."""
    import logging

    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

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


@pytest.mark.asyncio
async def test_decode_jwt_with_jwks_happy_path() -> None:
    """A valid asymmetric JWT decodes successfully using a mocked JWKS key."""
    from unittest.mock import patch

    from cryptography.hazmat.primitives import serialization

    # Create an asymmetric keypair using cryptography
    from cryptography.hazmat.primitives.asymmetric import rsa

    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # Create a token signed with the private key
    headers = {"kid": "mock_kid"}
    payload = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999,
        "iat": 1516239022,
    }
    token = jwt.encode(payload, private_key_pem, algorithm="RS256", headers=headers)

    # Mock the JWK Client to return our public key
    mock_signing_key = MagicMock()
    mock_signing_key.key = public_key_pem

    with patch("jwt.PyJWKClient.get_signing_key_from_jwt", return_value=mock_signing_key):
        verifier = SupabaseJWTVerifier()
        service = AuthService(AuthRepository(MagicMock()), verifier)
        decoded = await service.decode_jwt(token)

        assert isinstance(decoded, JWTPayload)
        assert str(decoded.sub) == payload["sub"]
        assert decoded.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_jwt_with_jwks_failure(caplog: pytest.LogCaptureFixture) -> None:
    """An asymmetric JWT failing JWKS verification raises an exception and logs it."""
    import logging
    from unittest.mock import patch

    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    # Create a dummy ES256 token (no valid signature needed since we'll mock the exception)
    token = jwt.encode({"sub": "test"}, "secret", algorithm="HS256")
    # Hack the header to look like ES256 to force the JWKS branch
    header = jwt.utils.base64url_encode(b'{"alg": "ES256", "kid": "bad"}').decode("ascii")
    token = f"{header}.{token.split('.')[1]}.{token.split('.')[2]}"

    with patch(
        "jwt.PyJWKClient.get_signing_key_from_jwt",
        side_effect=jwt.PyJWKClientError("Unable to find a signing key that matches"),
    ):
        verifier = SupabaseJWTVerifier()
        service = AuthService(AuthRepository(MagicMock()), verifier)

        with (
            caplog.at_level(logging.WARNING),
            pytest.raises(jwt.PyJWKClientError, match="Unable to find a signing key"),
        ):
            await service.decode_jwt(token)

        assert any(
            record.levelname == "WARNING" and "JWT validation failed" in record.message
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
