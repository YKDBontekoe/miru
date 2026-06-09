"""Tests for auth routes."""

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.api.dependencies import get_auth_service
from app.core.security.auth import get_current_user
from app.domain.auth.entities import Passkey
from app.main import app

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


@pytest.fixture
def override_auth(client: TestClient):
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id
    mock_service = MagicMock()
    app.dependency_overrides[get_auth_service] = lambda: mock_service
    yield client, mock_service, user_id
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_auth_service, None)


def test_get_registration_options(override_auth):
    client, mock_service, user_id = override_auth
    response = client.post("/api/v1/auth/passkey/register/options", json={})
    assert response.status_code == 200
    assert response.json()["challenge"] == "dummy_challenge"


def test_verify_registration(override_auth):
    client, mock_service, user_id = override_auth
    # Make sure verify_registration resolves
    import asyncio

    future = asyncio.Future()
    future.set_result(None)
    mock_service.verify_registration.return_value = future

    response = client.post(
        "/api/v1/auth/passkey/register/verify", json={"challenge_id": "ch", "credential": "cred"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_login_options(override_auth):
    client, mock_service, user_id = override_auth
    response = client.post("/api/v1/auth/passkey/login/options", json={"email": "test@test.com"})
    assert response.status_code == 200
    assert response.json()["challenge"] == "dummy_challenge"


def test_verify_login(override_auth):
    client, mock_service, user_id = override_auth
    response = client.post(
        "/api/v1/auth/passkey/login/verify", json={"credential": "c", "challenge_id": "c"}
    )
    assert response.status_code == 200
    assert response.json()["access_token"] == "dummy_access_token"


def test_list_passkeys(override_auth):
    client, mock_service, user_id = override_auth

    import asyncio

    future = asyncio.Future()
    mock_passkey = Passkey(
        id=uuid4(),
        user_id=user_id,
        credential_id="cred",
        public_key="pub",
        sign_count=0,
        device_name="test",
        created_at=datetime.datetime.now(),
        last_used_at=datetime.datetime.now(),
    )
    future.set_result(([mock_passkey], "next"))
    mock_service.list_passkeys.return_value = future

    response = client.get("/api/v1/auth/passkey/list")
    assert response.status_code == 200
    assert response.json()["next_cursor"] == "next"
    assert len(response.json()["passkeys"]) == 1


def test_delete_passkey_success(override_auth):
    client, mock_service, user_id = override_auth

    import asyncio

    future = asyncio.Future()
    future.set_result(True)
    mock_service.delete_passkey.return_value = future

    response = client.delete("/api/v1/auth/passkey/test_id")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_delete_passkey_not_found(override_auth):
    client, mock_service, user_id = override_auth

    import asyncio

    future = asyncio.Future()
    future.set_result(False)
    mock_service.delete_passkey.return_value = future

    response = client.delete("/api/v1/auth/passkey/test_id")
    assert response.status_code == 404
