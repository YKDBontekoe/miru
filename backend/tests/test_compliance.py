"""Tests for Data Privacy & Compliance suite."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_auth_service
from app.main import app


@pytest.fixture
def mock_auth_service() -> AsyncMock:
    service = AsyncMock()
    service.delete_account = AsyncMock(return_value=True)
    service.update_consent = AsyncMock(return_value=True)
    return service


@pytest.fixture
def test_client_with_auth(
    mock_auth_service: AsyncMock,
) -> Generator[tuple[TestClient, AsyncMock], None, None]:
    app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
    # Also need to mock get_current_user to bypass token verification
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: str(uuid4())
    client = TestClient(app)
    yield client, mock_auth_service
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_account_endpoint(test_client_with_auth: tuple[TestClient, AsyncMock]) -> None:
    client, mock_auth_service = test_client_with_auth

    response = client.delete("/api/v1/auth/account", headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    mock_auth_service.delete_account.assert_called_once()


@pytest.mark.asyncio
async def test_delete_account_endpoint_failure(
    test_client_with_auth: tuple[TestClient, AsyncMock],
) -> None:
    client, mock_auth_service = test_client_with_auth
    mock_auth_service.delete_account.return_value = False

    response = client.delete("/api/v1/auth/account", headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_consent_endpoint(test_client_with_auth: tuple[TestClient, AsyncMock]) -> None:
    client, mock_auth_service = test_client_with_auth

    payload = {"marketing_consent": True, "data_processing_consent": False}
    response = client.post(
        "/api/v1/auth/consent", json=payload, headers={"Authorization": "Bearer fake-token"}
    )

    assert response.status_code == 200
    mock_auth_service.update_consent.assert_called_once_with(
        mock_auth_service.update_consent.call_args[0][0], True, False
    )


@pytest.mark.asyncio
async def test_update_consent_endpoint_failure(
    test_client_with_auth: tuple[TestClient, AsyncMock],
) -> None:
    client, mock_auth_service = test_client_with_auth
    mock_auth_service.update_consent.return_value = False

    payload = {"marketing_consent": True, "data_processing_consent": False}
    response = client.post(
        "/api/v1/auth/consent", json=payload, headers={"Authorization": "Bearer fake-token"}
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_auth_repo_delete_account() -> None:
    # Test the auth repo's delete_account
    from app.infrastructure.repositories.auth_repo import AuthRepository

    mock_db = AsyncMock()
    repo = AuthRepository(db=mock_db)

    with patch("tortoise.transactions.in_transaction") as mock_tx:
        # mock in_transaction to do nothing
        # It's an async context manager
        mock_tx.return_value.__aenter__.return_value = None

        # Patch all the delete calls
        with (
            patch("app.domain.auth.models.Passkey.filter") as pf,
            patch("app.domain.auth.models.Profile.filter") as prof_f,
            patch("app.domain.agents.models.AgentActionLog.filter") as aal_f,
            patch("app.domain.agents.models.UserAgentAffinity.filter") as uaa_f,
            patch("app.domain.agents.models.Agent.filter") as ag_f,
            patch("app.domain.chat.models.ChatMessage.filter") as cm_f,
            patch("app.domain.chat.models.ChatRoom.filter") as cr_f,
            patch("app.domain.memory.models.Memory.filter") as m_f,
            patch("app.domain.memory.models.MemoryCollection.filter") as mc_f,
            patch("app.domain.memory.models.MemoryGraphNode.filter") as mgn_f,
            patch("app.domain.productivity.models.Task.filter") as t_f,
            patch("app.domain.productivity.models.Note.filter") as n_f,
            patch("app.domain.productivity.models.CalendarEvent.filter") as ce_f,
        ):
            # Setup mocks
            for m in [pf, prof_f, aal_f, uaa_f, ag_f, cm_f, cr_f, m_f, mc_f, mgn_f, t_f, n_f, ce_f]:
                m.return_value.delete = AsyncMock()

            # S3
            mock_db.storage.from_.return_value.list.return_value = [{"name": "file.jpg"}]

            result = await repo.delete_account(uuid4())

            assert result is True
            import asyncio

            if asyncio.iscoroutinefunction(mock_db.auth.admin.delete_user):
                mock_db.auth.admin.delete_user.assert_awaited_once()
            else:
                mock_db.auth.admin.delete_user.assert_called_once()
            pf.return_value.delete.assert_called_once()


@pytest.mark.asyncio
async def test_auth_repo_update_consent() -> None:
    from app.infrastructure.repositories.auth_repo import AuthRepository

    mock_db = AsyncMock()
    repo = AuthRepository(db=mock_db)

    with patch("app.domain.auth.models.Profile.get_or_none", new_callable=AsyncMock) as mock_get:
        mock_profile = AsyncMock()
        mock_get.return_value = mock_profile

        result = await repo.update_consent(uuid4(), True, True)

        assert result is True
        mock_profile.save.assert_awaited_once_with(
            update_fields=["marketing_consent", "data_processing_consent", "updated_at"]
        )


@pytest.mark.asyncio
async def test_auth_repo_update_consent_not_found() -> None:
    from app.infrastructure.repositories.auth_repo import AuthRepository

    mock_db = AsyncMock()
    repo = AuthRepository(db=mock_db)

    with patch("app.domain.auth.models.Profile.get_or_none", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None

        result = await repo.update_consent(uuid4(), True, True)

        assert result is False


@pytest.mark.asyncio
async def test_auth_service_methods() -> None:
    from app.domain.auth.service import AuthService

    mock_repo = AsyncMock()
    service = AuthService(repo=mock_repo)

    mock_repo.delete_account.return_value = True
    assert await service.delete_account(uuid4()) is True

    mock_repo.update_consent.return_value = True
    assert await service.update_consent(uuid4(), True, False) is True


@pytest.mark.asyncio
async def test_audit_log_middleware() -> None:

    from app.main import app

    with patch("app.domain.auth.models.AuditLog.create") as mock_create:
        # Use an AsyncClient to test the FastAPI app properly when it has background tasks
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.get("/api/v1/agents")

            # Wait for background task to complete
            import asyncio

            await asyncio.sleep(0.05)

            mock_create.assert_called_once()

            # also test the fallback when decoded user id fails
            mock_create.reset_mock()
            await client.get("/api/v1/agents", headers={"Authorization": "Bearer bad-token"})
            await asyncio.sleep(0.05)
            mock_create.assert_called_once()

            mock_create.reset_mock()
            mock_create.side_effect = Exception("db fail")
            await client.get("/api/v1/agents")
            await asyncio.sleep(0.05)
            mock_create.assert_called_once()


@pytest.mark.asyncio
async def test_auth_repo_delete_account_failure() -> None:
    from app.infrastructure.repositories.auth_repo import AuthRepository

    mock_db = AsyncMock()
    repo = AuthRepository(db=mock_db)

    import asyncio

    if asyncio.iscoroutinefunction(mock_db.auth.admin.delete_user):
        mock_db.auth.admin.delete_user.side_effect = Exception("Auth failure")
    else:
        # Mock it as a regular function if it's not a coroutine, or just set side effect
        mock_db.auth.admin.delete_user.side_effect = Exception("Auth failure")

    result = await repo.delete_account(uuid4())
    assert result is False


@pytest.mark.asyncio
async def test_auth_repo_update_consent_failure() -> None:
    from app.infrastructure.repositories.auth_repo import AuthRepository

    mock_db = AsyncMock()
    repo = AuthRepository(db=mock_db)

    with patch(
        "app.domain.auth.models.Profile.get_or_none",
        new_callable=AsyncMock,
        side_effect=Exception("DB error"),
    ):
        result = await repo.update_consent(uuid4(), True, True)
        assert result is False
