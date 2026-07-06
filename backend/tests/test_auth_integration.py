"""Integration tests for Auth API routes."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from tortoise.exceptions import IntegrityError

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from app.api.dependencies import get_auth_repo
from app.domain.auth.entities import Passkey as DomainPasskey
from app.domain.auth.entities import PasskeyCreate
from app.domain.auth.interfaces import AuthRepositoryProtocol
from app.infrastructure.database.models.auth_models import Passkey
from app.main import app

# TEST(miru-agent): refactor-required—the original AuthRepository uses SupabaseClient
# with deeply chained methods (Mock-Hell). We inject a Tortoise-based repo here to
# satisfy the Integration-First standard without mocking the DB layer.


class TortoiseAuthRepository(AuthRepositoryProtocol):
    async def get_passkeys_by_user(
        self, user_id: str | UUID, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[DomainPasskey], str | None]:
        query = Passkey.filter(user_id=user_id).order_by("-created_at").limit(limit)
        if cursor:
            query = query.filter(created_at__lt=cursor)
        records = await query

        entities = []
        for r in records:
            entities.append(
                DomainPasskey(
                    id=r.id,
                    user_id=r.user_id,
                    credential_id=r.credential_id,
                    public_key=r.public_key,
                    sign_count=r.sign_count,
                    device_name=r.device_name,
                    transports=r.transports,
                    last_used_at=r.last_used_at,
                    created_at=r.created_at,
                )
            )
        return entities, None

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        await Passkey.filter(id=passkey_id).update(sign_count=new_count)

    async def create_passkey(self, input: PasskeyCreate) -> DomainPasskey:
        record = await Passkey.create(
            id=uuid4(),
            user_id=input.user_id,
            credential_id=input.credential_id,
            public_key=input.public_key,
            device_name=input.device_name,
            transports=input.transports or [],
        )
        return DomainPasskey(
            id=record.id,
            user_id=record.user_id,
            credential_id=record.credential_id,
            public_key=record.public_key,
            sign_count=record.sign_count,
            device_name=record.device_name,
            transports=record.transports,
            last_used_at=record.last_used_at,
            created_at=record.created_at,
        )

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        deleted = await Passkey.filter(id=passkey_id, user_id=user_id).delete()
        return deleted > 0


@pytest.fixture(autouse=True)
def override_auth_repo(client: TestClient) -> AsyncGenerator[None, None]:
    from unittest.mock import MagicMock

    from app.infrastructure.database.supabase import get_supabase

    app.dependency_overrides[get_auth_repo] = lambda: TortoiseAuthRepository()
    app.dependency_overrides[get_supabase] = lambda: MagicMock()
    yield
    app.dependency_overrides.pop(get_auth_repo, None)
    app.dependency_overrides.pop(get_supabase, None)


@pytest_asyncio.fixture
async def seed_passkey(test_user_id: str) -> Passkey:
    return await Passkey.create(
        id=uuid4(),
        user_id=test_user_id,
        credential_id="test-cred-id",
        public_key="test-public-key",
        device_name="Test Device",
        transports=["usb", "nfc"],
    )


@pytest_asyncio.fixture(autouse=True)
async def cleanup_passkeys() -> AsyncGenerator[None, None]:
    """Cleanup fixture for tests to prevent IntegrityError across runs."""
    yield
    # Explicitly clear test data.
    await Passkey.all().delete()


@pytest.mark.asyncio
async def test_list_passkeys_returns_user_passkeys(
    client: TestClient, authed_headers: dict[str, str], seed_passkey: Passkey
) -> None:
    """Test successful retrieval of passkeys."""
    response = client.get("/api/v1/auth/passkey/list", headers=authed_headers)

    assert response.status_code == 200
    data = response.json()
    assert "passkeys" in data
    assert len(data["passkeys"]) == 1
    assert data["passkeys"][0]["credential_id"] == "test-cred-id"
    assert data["passkeys"][0]["device_name"] == "Test Device"


@pytest.mark.asyncio
async def test_delete_passkey_removes_from_db(
    client: TestClient, authed_headers: dict[str, str], seed_passkey: Passkey, test_user_id: str
) -> None:
    """Test successful deletion of a passkey."""
    passkey_id = str(seed_passkey.id)
    response = client.delete(f"/api/v1/auth/passkey/{passkey_id}", headers=authed_headers)

    assert response.status_code == 200

    # Assert DB directly
    db_passkey = await Passkey.filter(id=passkey_id).first()
    assert db_passkey is None


@pytest.mark.asyncio
async def test_delete_passkey_fails_for_unknown_id(
    client: TestClient, authed_headers: dict[str, str]
) -> None:
    """Test deletion with a non-existent passkey."""
    unknown_id = str(uuid4())
    response = client.delete(f"/api/v1/auth/passkey/{unknown_id}", headers=authed_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Passkey not found"


@pytest.mark.asyncio
async def test_delete_passkey_fails_for_other_user_passkey(
    client: TestClient, authed_headers: dict[str, str]
) -> None:
    """Test deletion fails if passkey belongs to someone else."""
    other_user_id = uuid4()
    other_passkey = await Passkey.create(
        id=uuid4(),
        user_id=other_user_id,
        credential_id="other-cred",
        public_key="other-key",
    )

    response = client.delete(f"/api/v1/auth/passkey/{other_passkey.id}", headers=authed_headers)

    assert response.status_code == 404

    # Assert DB still has it
    db_passkey = await Passkey.filter(id=other_passkey.id).first()
    assert db_passkey is not None


# --- Chaos Cases ---


@pytest.mark.parametrize(
    "payload",
    [
        {"invalid": "data"},
        {},
        {"challenge_id": 123, "credential": []},
    ],
)
def test_verify_registration_malformed_json(
    client: TestClient, authed_headers: dict[str, str], payload: dict[str, object]
) -> None:
    """Chaos: Malformed JSON payload for passkey registration."""
    response = client.post(
        "/api/v1/auth/passkey/register/verify", headers=authed_headers, json=payload
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_passkey_db_conflict(
    client: TestClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    """Chaos: Database conflict via IntegrityError during deletion."""

    # Simulate DB Conflict
    async def mock_delete(*args: object, **kwargs: object) -> bool:
        raise IntegrityError("Simulated DB Conflict")

    with pytest.MonkeyPatch.context() as m:
        m.setattr(TortoiseAuthRepository, "delete_passkey", mock_delete)

        passkey_id = str(uuid4())

        with pytest.raises(IntegrityError, match="Simulated DB Conflict"):
            client.delete(f"/api/v1/auth/passkey/{passkey_id}", headers=authed_headers)


def test_list_passkeys_network_timeout(client: TestClient, authed_headers: dict[str, str]) -> None:
    """Chaos: Simulate a network/service timeout when fetching the passkey list."""

    async def mock_timeout(*args: object, **kwargs: object) -> dict[str, str]:
        raise TimeoutError("Simulated Timeout")

    with pytest.MonkeyPatch.context() as m:
        from app.domain.auth.service import AuthService

        m.setattr(AuthService, "list_passkeys", mock_timeout)

        # Test client blocks until completion, raising the underlying error
        with pytest.raises(TimeoutError, match="Simulated Timeout"):
            # Trigger endpoint which eventually uses the service
            client.get("/api/v1/auth/passkey/list", headers=authed_headers)
