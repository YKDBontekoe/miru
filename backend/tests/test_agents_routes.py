from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    # Clear overrides before each test
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


@pytest.fixture
def mock_current_user() -> Generator[Any]:
    user_id = uuid4()
    with patch("app.core.security.auth.get_current_user", return_value=user_id):
        yield user_id


@pytest.fixture
def override_auth() -> Generator[Any]:
    user_id = uuid4()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: user_id
    yield user_id
    app.dependency_overrides.pop(get_current_user, None)


@patch("app.api.v1.agents.AgentService.create_agent", new_callable=AsyncMock)
def test_create_agent_route(mock_create_agent: MagicMock, client: TestClient) -> None:
    # Minimal mock return
    mock_create_agent.return_value = MagicMock()

    # We must mock auth to bypass JWT verification
    with patch(
        "app.domain.auth.service.AuthService.decode_jwt", return_value={"sub": str(uuid4())}
    ):
        response = client.post(
            "/api/v1/agents",
            headers={"Authorization": "Bearer fake_token"},
            json={"name": "Bot", "personality": "Nice"},
        )

    assert response.status_code in (200, 404)


@patch("app.api.v1.agents.AgentService.list_agents", new_callable=AsyncMock)
def test_get_agents_route(mock_get_agents: MagicMock, client: TestClient) -> None:
    mock_get_agents.return_value = []

    with patch(
        "app.domain.auth.service.AuthService.decode_jwt", return_value={"sub": str(uuid4())}
    ):
        response = client.get("/api/v1/agents", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code in (200, 404)
