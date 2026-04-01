from collections.abc import Generator
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

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
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    # Create Agent instance carefully (Tortoise M2M handling)
    now = datetime(2025, 1, 1, 12, 0)
    agent = Agent(
        id=UUID("12345678-1234-5678-1234-567812345678"),
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
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    mock_service.list_agents = AsyncMock(return_value=[])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.get("/api/v1/agents", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert response.json() == []


def test_build_agent_response_without_avatar() -> None:
    """Test that agent response is built correctly without an avatar_url field."""
    now = datetime(2025, 1, 1, 12, 0)
    agent = MagicMock()
    agent.pk = UUID("12345678-1234-5678-1234-567812345678")
    agent.user_id = UUID("12345678-1234-5678-1234-567812345678")
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


@pytest.mark.asyncio
async def test_agent_service_caching() -> None:
    from app.domain.agents.models import Capability, Integration
    from app.domain.agents.service import AgentService

    mock_repo = MagicMock()
    mock_repo.list_capabilities = AsyncMock(return_value=[Capability(id="cap1", name="Cap 1")])
    mock_repo.list_integrations = AsyncMock(return_value=[Integration(id="int1", type="Int 1")])

    service = AgentService(repo=mock_repo)

    # First call: hits repo
    caps1 = await service.list_capabilities()
    ints1 = await service.list_integrations()

    assert len(caps1) == 1
    assert len(ints1) == 1
    mock_repo.list_capabilities.assert_called_once()
    mock_repo.list_integrations.assert_called_once()

    # Second call: uses cache
    caps2 = await service.list_capabilities()
    ints2 = await service.list_integrations()

    assert caps2 == caps1
    assert ints2 == ints1
    # Call count should still be 1
    mock_repo.list_capabilities.assert_called_once()
    mock_repo.list_integrations.assert_called_once()


def test_create_agent_route_contract(client: TestClient) -> None:
    """Contract test validating AgentResponse schema from API."""
    from app.domain.agents.schemas import AgentResponse

    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")
    agent_id = UUID("12345678-1234-5678-1234-567812345678")

    now = datetime(2025, 1, 1, 12, 0)

    # We construct a pure AgentResponse to simulate what the service would return
    agent_response = AgentResponse(
        id=agent_id,
        name="Contract Bot",
        personality="Contract Personality",
        description="A bot to test contracts",
        system_prompt="You are a Contract Bot.",
        status="active",
        mood="Neutral",
        goals=["Goal A"],
        capabilities=["web_search"],
        integrations=["discord"],
        integration_configs={"discord": {"token": "x"}},
        message_count=5,
        created_at=now,
        updated_at=now,
    )

    # The endpoint returns what the service returns
    mock_service.create_agent = AsyncMock(return_value=agent_response)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": "Bearer fake_token"},
        json={
            "name": "Contract Bot",
            "personality": "Contract Personality",
            "capabilities": ["web_search"],
            "integrations": ["discord"],
            "integration_configs": {"discord": {"token": "x"}},
        },
    )

    assert response.status_code == 200

    # Contract validation: Does the JSON returned strictly conform to the expected Pydantic schema?
    # This acts as our contract test boundary check
    parsed_response = AgentResponse.model_validate(response.json())

    assert parsed_response.id == agent_id
    assert parsed_response.name == "Contract Bot"
    assert parsed_response.capabilities == ["web_search"]
    assert parsed_response.integrations == ["discord"]
    assert parsed_response.integration_configs == {"discord": {"token": "x"}}
    assert parsed_response.message_count == 5
    # Just asserting it passes validation successfully is the primary goal
