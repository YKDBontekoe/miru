"""Integration tests for Auth module adhering to Miru Test Standards."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from app.domain.auth.entities import PasskeyCreate
from app.infrastructure.database.models.auth_models import Passkey as PasskeyModel


@pytest.mark.asyncio
async def test_auth_repository_crud() -> None:
    """Test the AuthRepository using actual SQLite in-memory Tortoise db."""
    from app.infrastructure.repositories.auth_repo import AuthRepository

    repo = AuthRepository()

    user_id = uuid4()

    # 1. Create Passkey
    created = await repo.create_passkey(
        PasskeyCreate(
            user_id=user_id,
            credential_id="cred_id_123",
            public_key="pub_key_xyz",
            device_name="My Phone",
            transports=["internal"],
        )
    )
    assert created.user_id == user_id
    assert created.credential_id == "cred_id_123"

    # 2. Get Passkeys
    passkeys, cursor = await repo.get_passkeys_by_user(user_id)
    assert len(passkeys) == 1
    assert passkeys[0].credential_id == "cred_id_123"

    # 3. Update sign count
    await repo.update_sign_count(created.id, 5)

    # Verify via Model directly
    updated = await PasskeyModel.get(id=created.id)
    assert updated.sign_count == 5
    assert updated.last_used_at is not None

    # 4. Delete Passkey
    deleted = await repo.delete_passkey(created.id, user_id)
    assert deleted is True

    # Verify
    passkeys_after, _ = await repo.get_passkeys_by_user(user_id)
    assert len(passkeys_after) == 0


@pytest.mark.asyncio
async def test_api_passkey_deletion_fails_when_not_found(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """Boundary test covering chaos case of 404 passkey. Real DB is seeded and used."""

    # Attempt to delete a passkey that does not exist in DB
    random_id = str(uuid4())
    response = client.delete(f"/api/v1/auth/passkey/{random_id}", headers=authed_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Passkey not found"


@pytest.mark.asyncio
async def test_api_passkey_list_success(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """Boundary test covering happy path for list passkeys with actual DB Seed."""

    user_id = UUID(test_user_id)
    # Seed DB directly
    _ = await PasskeyModel.create(
        user_id=user_id,
        credential_id="cred1",
        public_key="pub1",
        device_name="Device 1",
    )
    _ = await PasskeyModel.create(
        user_id=user_id,
        credential_id="cred2",
        public_key="pub2",
        device_name="Device 2",
    )

    response = client.get("/api/v1/auth/passkey/list", headers=authed_headers)

    assert response.status_code == 200

    data = response.json()
    assert len(data["passkeys"]) == 2

    # The default order is desc by created_at, so p2 comes first since it was created later
    assert data["passkeys"][0]["credential_id"] == "cred2"
    assert data["passkeys"][0]["device_name"] == "Device 2"
    assert data["passkeys"][1]["credential_id"] == "cred1"


@pytest.mark.asyncio
async def test_api_passkey_delete_success(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """Boundary test covering happy path for delete passkey with actual DB Seed."""
    user_id = UUID(test_user_id)
    # Seed DB directly
    p1 = await PasskeyModel.create(
        user_id=user_id,
        credential_id="cred1",
        public_key="pub1",
        device_name="Device 1",
    )

    # Act: call the delete route
    response = client.delete(f"/api/v1/auth/passkey/{p1.id}", headers=authed_headers)
    assert response.status_code == 200

    # Assert: verify side-effect in DB
    db_record = await PasskeyModel.get_or_none(id=p1.id)
    assert db_record is None


@pytest.mark.asyncio
async def test_api_registration_and_login_options(
    client: TestClient, authed_headers: dict[str, str]
) -> None:
    """Boundary test for unauthenticated and authenticated options requests."""

    # Registration options (Authed)
    res = client.post(
        "/api/v1/auth/passkey/register/options",
        json={"device_name": "My Device"},
        headers=authed_headers,
    )
    assert res.status_code == 200
    assert res.json()["challenge"] == "dummy_challenge"

    # Registration options (Unauthed) -> 401
    res = client.post("/api/v1/auth/passkey/register/options", json={"device_name": "My Device"})
    assert res.status_code in (401, 403)

    # Registration verify (Authed)
    res = client.post(
        "/api/v1/auth/passkey/register/verify",
        json={"challenge_id": "ch1", "credential": "{}", "device_name": "Device 1"},
        headers=authed_headers,
    )
    assert res.status_code == 200

    # Login options (Unauthed)
    res = client.post("/api/v1/auth/passkey/login/options", json={"email": "test@test.com"})
    assert res.status_code == 200

    # Login verify (Unauthed)
    res = client.post(
        "/api/v1/auth/passkey/login/verify", json={"challenge_id": "ch1", "credential": "{}"}
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_auth_repo_pagination_cursor_hits() -> None:
    """Test get_passkeys_by_user pagination cursor branch."""
    from app.infrastructure.repositories.auth_repo import AuthRepository

    repo = AuthRepository()

    user_id = uuid4()
    # It misses lines 40 (cursor=True filter) and 49 (next_cursor assignment).
    # To hit 49 we need len(entities) == limit

    _ = await repo.create_passkey(
        PasskeyCreate(
            user_id=user_id,
            credential_id="cred_id_1",
            public_key="pub_key_1",
        )
    )

    _ = await repo.create_passkey(
        PasskeyCreate(
            user_id=user_id,
            credential_id="cred_id_2",
            public_key="pub_key_2",
        )
    )

    # Let's hit line 49
    # limit=1 will trigger it
    passkeys, cursor = await repo.get_passkeys_by_user(user_id, limit=1)

    assert cursor is not None

    # Now use cursor to hit line 40
    passkeys2, cursor2 = await repo.get_passkeys_by_user(user_id, limit=1, cursor=cursor)
