from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_agent_service
from app.core.security.auth import get_current_user
from app.domain.agents.models import Agent
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


def test_create_agent_route(client: TestClient) -> None:
    mock_service = MagicMock()
    user_id = uuid4()

    # Mock the return value of the service
    mock_service.create_agent = AsyncMock(return_value=Agent(
        id=uuid4(),
        user_id=user_id,
        name="Bot",
        personality="Friendly",
        goals=[],
        capabilities=[],
        integrations=[]
    ))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": "Bearer fake_token"},
        json={"name": "Bot", "personality": "Friendly"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Bot"


def test_get_agents_route(client: TestClient) -> None:
    mock_service = MagicMock()
    user_id = uuid4()

    mock_service.list_agents = AsyncMock(return_value=[])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.get(
        "/api/v1/agents",
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    assert response.json() == []
