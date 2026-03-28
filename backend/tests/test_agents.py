from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_agent_service
from app.core.security.auth import get_current_user
from app.domain.agents.models import AgentGenerationResponse
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


def test_generate_agent_network_error(client: TestClient) -> None:
    """Test that a network error during agent generation returns a 503 response."""
    mock_service = MagicMock()
    user_id = uuid4()

    # Mock the service to raise an OSError (e.g., Network unreachable)
    mock_service.generate_agent_profile = AsyncMock(
        side_effect=OSError(101, "Network is unreachable")
    )

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={"keywords": "friendly pirate"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Upstream AI service is currently unreachable"


def test_generate_agent_success(client: TestClient) -> None:
    """Test successful agent generation."""
    mock_service = MagicMock()
    user_id = uuid4()

    mock_response = AgentGenerationResponse(
        name="Pirate Pete",
        personality="Friendly and adventurous",
        description="A helpful pirate",
        capabilities=["chat", "search"],
        suggested_integrations=["slack"],
        goals=["Help users find treasure"],
    )
    mock_service.generate_agent_profile = AsyncMock(return_value=mock_response)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={"keywords": "friendly pirate"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Pirate Pete"
