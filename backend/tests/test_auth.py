"""Tests for authentication and JWT verification."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import jwt
import pytest

from app.domain.auth.models import JWTPayload
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
    service = AuthService(AuthRepository(MagicMock()))
    payload = await service.decode_jwt(token)

    assert isinstance(payload, JWTPayload)
    assert payload.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_401() -> None:
    """An expired JWT raises an error."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository

    token = make_jwt(expired=True)
    service = AuthService(AuthRepository(MagicMock()))

    with pytest.raises(jwt.ExpiredSignatureError):
        await service.decode_jwt(token)


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
async def test_update_preferences(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """A user can update their marketing and data processing consent preferences."""
    from uuid import UUID

    from app.domain.auth.models import Profile

    # First, create a profile to test with
    user_id = UUID(test_user_id)
    await Profile.create(id=user_id, display_name="Test User")

    try:
        payload = {"marketing_consent": True, "data_processing_consent": False}
        response = client.patch(
            "/api/v1/auth/account/preferences",
            json=payload,
            headers=authed_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

        # Verify it was updated
        updated_profile = await Profile.get(id=user_id)
        assert updated_profile.marketing_consent is True
        assert updated_profile.data_processing_consent is False

        # Update just one field
        payload2 = {"data_processing_consent": True}
        response2 = client.patch(
            "/api/v1/auth/account/preferences",
            json=payload2,
            headers=authed_headers,
        )
        assert response2.status_code == 200
        updated_profile2 = await Profile.get(id=user_id)
        assert updated_profile2.marketing_consent is True  # Unchanged
        assert updated_profile2.data_processing_consent is True  # Changed
    finally:
        # Cleanup
        await Profile.filter(id=user_id).delete()


@pytest.mark.asyncio
async def test_update_preferences_profile_not_found(
    client: TestClient, authed_headers: dict[str, str]
) -> None:
    """Updating preferences for a non-existent profile returns 404."""
    payload = {"marketing_consent": True}
    response = client.patch(
        "/api/v1/auth/account/preferences",
        json=payload,
        headers=authed_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found"


@pytest.mark.asyncio
async def test_delete_account(client: TestClient, authed_headers: dict[str, str]) -> None:
    """A user can delete their account."""
    from unittest.mock import patch

    with patch("app.infrastructure.database.supabase.get_supabase") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.delete(
            "/api/v1/auth/account",
            headers=authed_headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        mock_supabase.auth.admin.delete_user.assert_called_once()
