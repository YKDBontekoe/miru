from collections.abc import Generator
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from openai import APIConnectionError

try:
    from instructor.core.exceptions import InstructorRetryException
except ImportError:
    from instructor.exceptions import InstructorRetryException

from app.api.dependencies import get_agent_service
from app.core.security.auth import get_current_user
from app.domain.agents.models import Agent
from app.domain.agents.service import _build_agent_response
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


def test_create_agent_route(client: TestClient) -> None:
    mock_service = MagicMock()
    user_id = uuid4()

    # Create Agent instance carefully (Tortoise M2M handling)
    now = datetime.now()
    agent = Agent(
        id=uuid4(),
        user_id=user_id,
        name="Bot",
        personality="Friendly",
        goals=[],
        created_at=now,
        updated_at=now,
    )

    # Mock the return value of the service
    mock_service.create_agent = AsyncMock(return_value=agent)

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

    response = client.get("/api/v1/agents", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert response.json() == []


def test_build_agent_response_without_avatar() -> None:
    """Test that agent response is built correctly without an avatar_url field."""
    now = datetime.now()
    agent = MagicMock()
    agent.pk = uuid4()
    agent.user_id = uuid4()
    agent.name = "Test Agent"
    agent.personality = "Test Personality"
    agent.description = "Test Description"
    agent.system_prompt = "Test Prompt"
    agent.status = "active"
    agent.mood = "Neutral"
    agent.goals = ["Goal 1", "Goal 2"]
    agent.message_count = 0
    agent.created_at = now
    agent.updated_at = now

    # Mock prefetched relations
    cap1 = MagicMock()
    cap1.pk = "cap1"
    cap2 = MagicMock()
    cap2.pk = "cap2"

    caps_mock = MagicMock()
    caps_mock.related_objects = [cap1, cap2]
    agent.capabilities = caps_mock

    integration_mock = MagicMock()
    integration_mock.integration_id = "steam"
    integration_mock.enabled = True
    integration_mock.config = {"steam_id": "123"}
    agent.agent_integrations = [integration_mock]

    response = _build_agent_response(agent)

    assert response.name == "Test Agent"
    assert response.personality == "Test Personality"
    assert response.description == "Test Description"
    assert response.system_prompt == "Test Prompt"
    assert response.status == "active"
    assert response.mood == "Neutral"
    assert response.goals == ["Goal 1", "Goal 2"]
    assert response.capabilities == ["cap1", "cap2"]
    assert response.integrations == ["steam"]
    assert response.integration_configs == {"steam": {"steam_id": "123"}}
    assert not hasattr(response, "avatar_url")


def test_generate_agent_network_error(client: TestClient) -> None:
    mock_service = MagicMock()
    mock_service.generate_agent_profile = AsyncMock(
        side_effect=APIConnectionError(request=MagicMock())
    )

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={"keywords": "friendly assistant"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Upstream AI service is currently unreachable"


def test_generate_agent_oserror(client: TestClient) -> None:
    mock_service = MagicMock()
    mock_service.generate_agent_profile = AsyncMock(side_effect=OSError("Network is unreachable"))

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={"keywords": "friendly assistant"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Upstream AI service is currently unreachable"


def test_generate_agent_instructor_retry_exception(client: TestClient) -> None:
    mock_service = MagicMock()
    mock_service.generate_agent_profile = AsyncMock(
        side_effect=InstructorRetryException(n_attempts=3, last_completion=None, total_usage=0)
    )

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={"keywords": "friendly assistant"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Upstream AI service failed to generate a valid response"
