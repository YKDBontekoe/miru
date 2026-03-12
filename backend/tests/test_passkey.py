"""Tests for passkey / WebAuthn challenge store and helpers."""

from __future__ import annotations

import time
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.database import get_supabase
from app.main import app


@pytest.fixture
def client_with_overrides():
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


# ---------------------------------------------------------------------------
# Challenge store unit tests
# ---------------------------------------------------------------------------


def test_store_and_pop_challenge() -> None:
    """A stored challenge can be retrieved once."""
    from app.passkey import _pop_challenge, _store_challenge

    challenge_bytes = b"test-challenge-bytes"
    user_id = str(uuid4())

    challenge_id = _store_challenge(challenge_bytes, user_id=user_id)
    assert challenge_id  # non-empty string

    entry = _pop_challenge(challenge_id)
    assert entry["challenge"] == challenge_bytes
    assert entry["user_id"] == user_id


def test_pop_challenge_removes_it() -> None:
    """Popping a challenge a second time raises ValueError."""
    from app.passkey import _pop_challenge, _store_challenge

    challenge_id = _store_challenge(b"once", user_id="uid")
    _pop_challenge(challenge_id)  # first pop — ok

    with pytest.raises(ValueError, match="not found"):
        _pop_challenge(challenge_id)  # second pop — should fail


def test_pop_unknown_challenge_raises() -> None:
    """Popping a non-existent challenge_id raises ValueError."""
    from app.passkey import _pop_challenge

    with pytest.raises(ValueError, match="not found"):
        _pop_challenge("does-not-exist")


def test_expired_challenge_is_rejected() -> None:
    """A challenge past its TTL is rejected even if it exists in the store."""
    from app.passkey import _challenge_store, _pop_challenge, _store_challenge

    challenge_id = _store_challenge(b"expiring", user_id="uid")
    # Manually back-date the expiry.
    _challenge_store[challenge_id]["expires_at"] = time.time() - 1

    with pytest.raises(ValueError, match="expired"):
        _pop_challenge(challenge_id)


def test_evict_expired_challenges() -> None:
    """Expired challenges are evicted when a new challenge is stored."""
    from app.passkey import _challenge_store, _store_challenge

    # Store one and expire it manually.
    old_id = _store_challenge(b"old", user_id="uid")
    _challenge_store[old_id]["expires_at"] = time.time() - 1

    # Store a fresh one — triggers eviction of old.
    _store_challenge(b"new", user_id="uid2")

    assert old_id not in _challenge_store


# ---------------------------------------------------------------------------
# _decode_credential_id unit tests
# ---------------------------------------------------------------------------


def test_decode_credential_id_bytes() -> None:
    """Passing raw bytes returns them unchanged."""
    from app.passkey import _decode_credential_id

    data = b"\x01\x02\x03"
    assert _decode_credential_id(data) == data


def test_decode_credential_id_hex_string() -> None:
    """A \\x-prefixed hex string is decoded correctly."""
    from app.passkey import _decode_credential_id

    assert _decode_credential_id("\\x010203") == b"\x01\x02\x03"


def test_decode_credential_id_list() -> None:
    """A list of ints (Supabase bytea as array) is decoded correctly."""
    from app.passkey import _decode_credential_id

    assert _decode_credential_id([1, 2, 3]) == b"\x01\x02\x03"


# ---------------------------------------------------------------------------
# Passkey API endpoint tests
# ---------------------------------------------------------------------------


def test_register_options_requires_auth(client: TestClient) -> None:
    """GET registration options without auth returns 403."""
    response = client.post(
        "/api/auth/passkey/register/options",
        json={"device_name": "My device"},
    )
    assert response.status_code in (401, 403)


@patch("app.routes.generate_registration_options")
@patch("app.routes._get_user_email_from_jwt")
def test_register_options_with_valid_auth(
    mock_email: MagicMock,
    mock_gen: MagicMock,
    client_with_overrides: TestClient,
    test_user_id: str,
) -> None:
    """Authenticated users can fetch registration options."""
    mock_email.return_value = "test@example.com"
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []  # fmt: skip

    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: uuid4()

    mock_gen.return_value = {
        "challenge_id": "test-challenge-id",
        "options": {"challenge": "abc", "rp": {"name": "Miru"}},
    }

    response = client_with_overrides.post(
        "/api/auth/passkey/register/options",
        json={"device_name": "My MacBook"},
        headers={"Authorization": "Bearer fake_token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "challenge_id" in data
    assert "options" in data


def test_login_options_missing_email(client: TestClient) -> None:
    """login/options without email body returns 422."""
    response = client.post("/api/auth/passkey/login/options", json={})
    assert response.status_code == 422


@patch("app.routes.generate_authentication_options")
def test_login_options_no_passkeys(
    mock_gen: MagicMock,
    client: TestClient,
) -> None:
    """login/options returns 400 when user has no passkeys."""
    mock_gen.side_effect = ValueError("No passkeys registered for this account")

    response = client.post(
        "/api/auth/passkey/login/options",
        json={"email": "nobody@example.com"},
    )
    assert response.status_code == 400


@patch("app.routes.verify_authentication")
def test_login_verify_bad_credential(
    mock_verify: MagicMock,
    client: TestClient,
) -> None:
    """login/verify returns 401 when assertion verification fails."""
    mock_verify.side_effect = ValueError("Signature verification failed")

    response = client.post(
        "/api/auth/passkey/login/verify",
        json={"challenge_id": "cid", "credential": "{}"},
    )
    assert response.status_code == 401


def test_passkey_list_requires_auth(client: TestClient) -> None:
    """Listing passkeys without auth returns 403."""
    response = client.get("/api/auth/passkey/list")
    assert response.status_code in (401, 403)


def test_passkey_list_returns_passkeys(
    client_with_overrides: TestClient,
) -> None:
    """Authenticated users get their passkeys list."""
    mock_supabase = MagicMock()
    # fmt: off
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {
            "id": "pk-1",
            "device_name": "My iPhone",
            "transports": ["internal"],
            "created_at": "2026-01-01T00:00:00Z",
            "last_used_at": None,
        }
    ]
    # fmt: on
    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: uuid4()

    response = client_with_overrides.get(
        "/api/auth/passkey/list", headers={"Authorization": "Bearer fake_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["passkeys"]) == 1
    assert data["passkeys"][0]["device_name"] == "My iPhone"


def test_passkey_delete_not_found(
    client_with_overrides: TestClient,
) -> None:
    """Deleting a non-existent passkey returns 404."""
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []  # fmt: skip

    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: uuid4()

    response = client_with_overrides.delete(
        "/api/auth/passkey/nonexistent-id",
        headers={"Authorization": "Bearer fake_token"},
    )
    assert response.status_code == 404
