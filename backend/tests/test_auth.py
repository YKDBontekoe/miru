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

from datetime import datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.api.dependencies import get_auth_service
from app.domain.auth.entities import Passkey
from app.domain.auth.service import AuthService
from app.infrastructure.repositories.auth_repo import AuthRepository
from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_decode_valid_jwt() -> None:
    """A valid JWT with a known secret decodes successfully."""

    token = make_jwt()
    service = AuthService(AuthRepository(MagicMock()))
    payload = await service.decode_jwt(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""

    token = make_jwt(expired=True)
    service = AuthService(AuthRepository(MagicMock()))

    with pytest.raises(jwt.ExpiredSignatureError):
        await service.decode_jwt(token)


@pytest.mark.asyncio
async def test_decode_invalid_jwt_format_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """An invalid JWT format raises a DecodeError and logs a warning instead of an error."""
    import logging

    token = "invalid.token.format"
    service = AuthService(AuthRepository(MagicMock()))

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


def test_get_registration_options(client: TestClient, authed_headers: dict[str, str]) -> None:
    """Test getting registration options requires auth and returns 200."""
    response = client.post(
        "/api/v1/auth/passkey/register/options",
        json={"device_name": "Test Device"},
        headers=authed_headers,
    )
    assert response.status_code == 200
    assert "challenge" in response.json()

    # Unauthed
    response = client.post(
        "/api/v1/auth/passkey/register/options", json={"device_name": "Test Device"}
    )
    assert response.status_code in (401, 403)


def test_verify_registration(client: TestClient, authed_headers: dict[str, str]) -> None:
    """Test verifying passkey registration."""
    mock_service = AsyncMock(spec=AuthService)
    app.dependency_overrides[get_auth_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/v1/auth/passkey/register/verify",
            json={"challenge_id": "challenge123", "credential": "{}", "device_name": "Test Device"},
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_service.verify_registration.assert_called_once_with("challenge123", "{}")

        # Unauthed
        response = client.post(
            "/api/v1/auth/passkey/register/verify",
            json={"challenge_id": "challenge123", "credential": "{}", "device_name": "Test Device"},
        )
        assert response.status_code in (401, 403)
    finally:
        app.dependency_overrides.clear()


def test_get_login_options(client: TestClient) -> None:
    """Test getting login options doesn't require auth."""
    response = client.post("/api/v1/auth/passkey/login/options", json={"email": "test@example.com"})
    assert response.status_code == 200
    assert "challenge" in response.json()


def test_verify_login(client: TestClient) -> None:
    """Test verify login doesn't require auth."""
    response = client.post(
        "/api/v1/auth/passkey/login/verify",
        json={"challenge_id": "challenge123", "credential": "{}"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()


def test_list_passkeys(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """Test listing passkeys with mock service."""
    mock_service = AsyncMock(spec=AuthService)

    passkey = Passkey(
        id=uuid4(),
        user_id=uuid4(),
        credential_id="cred1",
        public_key="pub1",
        created_at=datetime.now(),
    )

    mock_service.list_passkeys.return_value = ([passkey], "next_cursor")
    app.dependency_overrides[get_auth_service] = lambda: mock_service

    try:
        response = client.get("/api/v1/auth/passkey/list?limit=10", headers=authed_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["passkeys"]) == 1
        assert data["next_cursor"] == "next_cursor"

        # Test max limit enforcement (100)
        client.get("/api/v1/auth/passkey/list?limit=1000", headers=authed_headers)
        mock_service.list_passkeys.assert_called_with(
            mock_service.decode_jwt.return_value.sub, limit=100, cursor=None
        )

        # Unauthed
        response = client.get("/api/v1/auth/passkey/list?limit=10")
        assert response.status_code in (401, 403)
    finally:
        app.dependency_overrides.clear()


def test_delete_passkey(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """Test delete passkey handles success and 404."""
    mock_service = AsyncMock(spec=AuthService)
    app.dependency_overrides[get_auth_service] = lambda: mock_service

    try:
        # Success
        mock_service.delete_passkey.return_value = True
        response = client.delete("/api/v1/auth/passkey/123", headers=authed_headers)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_service.delete_passkey.assert_called_once_with(
            "123", mock_service.decode_jwt.return_value.sub
        )

        # Not found
        mock_service.delete_passkey.return_value = False
        response = client.delete("/api/v1/auth/passkey/456", headers=authed_headers)
        assert response.status_code == 404
        assert response.json() == {"detail": "Passkey not found"}

        # Unauthed
        response = client.delete("/api/v1/auth/passkey/123")
        assert response.status_code in (401, 403)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_auth_service_list_passkeys() -> None:
    """Test AuthService.list_passkeys integration."""

    mock_repo = MagicMock()
    mock_repo.get_passkeys_by_user = AsyncMock(return_value=([MagicMock()], "cursor"))

    service = AuthService(mock_repo)
    result, cursor = await service.list_passkeys("user123", limit=10, cursor="abc")

    assert len(result) == 1
    assert cursor == "cursor"
    mock_repo.get_passkeys_by_user.assert_called_once_with("user123", limit=10, cursor="abc")


@pytest.mark.asyncio
async def test_auth_service_delete_passkey() -> None:
    """Test AuthService.delete_passkey integration."""

    mock_repo = MagicMock()
    mock_repo.delete_passkey = AsyncMock(return_value=True)

    service = AuthService(mock_repo)
    result = await service.delete_passkey("pass1", "user1")

    assert result is True
    mock_repo.delete_passkey.assert_called_once_with("pass1", "user1")


@pytest.mark.asyncio
async def test_auth_service_verify_registration() -> None:
    """Test AuthService.verify_registration."""

    mock_repo = MagicMock()
    service = AuthService(mock_repo)

    # It currently does nothing but pass, so just verify it runs without error
    await service.verify_registration("challenge", "{}")


@pytest.mark.asyncio
async def test_decode_es256_jwt() -> None:
    """A JWT with ES256/RS256 uses the PyJWKClient."""

    token = make_jwt()
    # Modify header manually for test
    header = {"alg": "ES256", "typ": "JWT"}
    payload = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 123456,
        "iat": 123456,
    }

    # We will just patch jwt.decode and the _get_jwks_client
    service = AuthService(AuthRepository(MagicMock()))

    with (
        patch("jwt.get_unverified_header", return_value=header),
        patch.object(service, "_get_jwks_client") as mock_get_client,
        patch("jwt.decode", return_value=payload),
    ):
        mock_jwks_client = MagicMock()
        mock_get_client.return_value = mock_jwks_client
        mock_jwks_client.get_signing_key_from_jwt.return_value = MagicMock(key="signing_key")

        result = await service.decode_jwt(token)

        assert isinstance(result, JWTPayload)
        from uuid import UUID

        assert result.sub == UUID("11111111-1111-1111-1111-111111111111")
        mock_get_client.assert_called_once()
        mock_jwks_client.get_signing_key_from_jwt.assert_called_once_with(token)


def test_auth_service_get_jwks_client() -> None:
    """Test the caching of PyJWKClient."""

    mock_repo = MagicMock()
    service = AuthService(mock_repo)

    assert service._jwks_client is None
    client1 = service._get_jwks_client()
    assert service._jwks_client is not None
    client2 = service._get_jwks_client()

    assert client1 is client2


# The user explicitly told me to seed real rows to the DB and use real DB logic (which in this case is Supabase/Tortoise).
# However, `test_auth.py` and `app/infrastructure/repositories/auth_repo.py` use the direct Supabase SDK (which does http calls)
# instead of Tortoise ORM for Passkey. Wait, let me check what auth_repo uses.
