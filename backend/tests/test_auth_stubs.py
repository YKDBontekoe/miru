"""Tests for auth endpoints — regression guard against stub regressions and dummy tokens."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_passkey_register_options_requires_auth(async_client: AsyncClient) -> None:
    """Registration options endpoint must require Bearer token."""
    resp = await async_client.post("/api/v1/auth/passkey/register/options", json={})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_passkey_register_options_returns_challenge(
    async_client: AsyncClient, user_id: str
) -> None:
    """Registration options must return a challenge_id and a real (not dummy) challenge."""
    token = make_jwt(user_id)

    mock_options = MagicMock()
    mock_options.challenge = b"real_challenge_bytes_here"

    import json as _json
    mock_json = _json.dumps({
        "challenge": "cmVhbF9jaGFsbGVuZ2VfYnl0ZXNfaGVyZQ",
        "rp": {"id": "localhost", "name": "Miru Test"},
        "user": {"id": "dXNlcg", "name": "test@example.com", "displayName": "test@example.com"},
        "pubKeyCredParams": [],
        "timeout": 60000,
        "excludeCredentials": [],
    })

    with (
        patch("app.domain.auth.service.webauthn.generate_registration_options", return_value=mock_options),
        patch("app.domain.auth.service.webauthn.options_to_json", return_value=mock_json),
        patch("app.api.v1.auth.get_supabase_client") as mock_client,
    ):
        mock_client.return_value.auth.admin.get_user_by_id.return_value = MagicMock(
            user=MagicMock(email="test@example.com")
        )
        resp = await async_client.post(
            "/api/v1/auth/passkey/register/options",
            json={"device_name": "Test Device"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "challenge_id" in data
    assert data.get("challenge") != "dummy_challenge"


@pytest.mark.asyncio
async def test_passkey_login_options_returns_challenge(async_client: AsyncClient) -> None:
    """Login options must return a challenge_id and a real (not dummy) challenge."""
    mock_options = MagicMock()
    mock_options.challenge = b"real_auth_challenge"

    import json as _json
    mock_json = _json.dumps({
        "challenge": "cmVhbF9hdXRoX2NoYWxsZW5nZQ",
        "timeout": 60000,
        "rpId": "localhost",
        "allowCredentials": [],
        "userVerification": "preferred",
    })

    with (
        patch("app.domain.auth.service.webauthn.generate_authentication_options", return_value=mock_options),
        patch("app.domain.auth.service.webauthn.options_to_json", return_value=mock_json),
    ):
        resp = await async_client.post(
            "/api/v1/auth/passkey/login/options",
            json={"email": "test@example.com"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data.get("challenge") != "dummy_challenge"
    assert "challenge_id" in data


@pytest.mark.asyncio
async def test_passkey_login_verify_rejects_bad_challenge(async_client: AsyncClient) -> None:
    """Login verify must return 400 for an unknown/expired challenge_id."""
    resp = await async_client.post(
        "/api/v1/auth/passkey/login/verify",
        json={"challenge_id": "nonexistent-id", "credential": "{}"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Challenge not found or expired"


@pytest.mark.asyncio
async def test_passkey_login_verify_never_returns_dummy_token(async_client: AsyncClient) -> None:
    """Even on a 200 response, access_token must never be the dummy placeholder."""
    # If somehow the endpoint returns 200, the token must not be "dummy_access_token"
    resp = await async_client.post(
        "/api/v1/auth/passkey/login/verify",
        json={"challenge_id": "nonexistent", "credential": "{}"},
    )
    if resp.status_code == 200:
        assert resp.json().get("access_token") != "dummy_access_token"


@pytest.mark.asyncio
async def test_passkey_list_requires_auth(async_client: AsyncClient) -> None:
    """Passkey list endpoint must require authentication."""
    resp = await async_client.get("/api/v1/auth/passkey/list")
    assert resp.status_code == 403
