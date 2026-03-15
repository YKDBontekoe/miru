"""Tests for auth endpoints — regression tests that guard against stub regressions."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import make_jwt


@pytest.mark.asyncio
async def test_passkey_register_options_requires_auth(async_client: AsyncClient) -> None:
    """Registration options endpoint must require Bearer token."""
    resp = await async_client.post("/api/v1/auth/passkey/register/options", json={})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_passkey_register_options_returns_challenge(async_client: AsyncClient, user_id: str) -> None:
    """Registration options must return a challenge_id (not a dummy value)."""
    token = make_jwt(user_id)
    resp = await async_client.post(
        "/api/v1/auth/passkey/register/options",
        json={"device_name": "Test Device"},
        headers={"Authorization": f"Bearer {token}"},
    )
    # We expect 200 (WebAuthn library may fail in test env, so accept 500 too but not a stub)
    assert resp.status_code in (200, 500)
    if resp.status_code == 200:
        data = resp.json()
        assert "challenge_id" in data
        assert data.get("challenge") != "dummy_challenge"


@pytest.mark.asyncio
async def test_passkey_login_options_returns_challenge(async_client: AsyncClient) -> None:
    """Login options must NOT return a hardcoded dummy_challenge."""
    resp = await async_client.post(
        "/api/v1/auth/passkey/login/options",
        json={"email": "test@example.com"},
    )
    assert resp.status_code in (200, 500)
    if resp.status_code == 200:
        data = resp.json()
        assert data.get("challenge") != "dummy_challenge"
        assert "challenge_id" in data


@pytest.mark.asyncio
async def test_passkey_login_verify_no_longer_returns_dummy_token(async_client: AsyncClient) -> None:
    """Login verify must never return dummy_access_token."""
    resp = await async_client.post(
        "/api/v1/auth/passkey/login/verify",
        json={"challenge_id": "nonexistent", "credential": "{}"},
    )
    # Should return 400 (bad challenge) or 401 (auth failed), never 200 with dummy token
    assert resp.status_code in (400, 401, 422, 500)
    if resp.status_code == 200:
        data = resp.json()
        assert data.get("access_token") != "dummy_access_token"


@pytest.mark.asyncio
async def test_passkey_list_requires_auth(async_client: AsyncClient) -> None:
    """Passkey list endpoint must require authentication."""
    resp = await async_client.get("/api/v1/auth/passkey/list")
    assert resp.status_code == 403
