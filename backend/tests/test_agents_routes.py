from collections.abc import Generator
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

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
    from app.domain.agents.entities import AgentEntity, AgentIntegrationEntity, CapabilityEntity

    now = datetime.now()
    cap1 = CapabilityEntity(
        id="cap1", name="Cap1", description="desc", icon="icon", status="active", created_at=now
    )
    cap2 = CapabilityEntity(
        id="cap2", name="Cap2", description="desc", icon="icon", status="active", created_at=now
    )

    integration_mock = AgentIntegrationEntity(
        id=uuid4(),
        agent_id=uuid4(),
        integration_id="steam",
        enabled=True,
        config={"steam_id": "123"},
        credentials={},
        connected_at=now,
        created_at=now,
        updated_at=now,
    )

    agent = AgentEntity(
        id=uuid4(),
        user_id=uuid4(),
        name="Test Agent",
        personality="Test Personality",
        description="Test Description",
        system_prompt="Test Prompt",
        status="active",
        mood="Neutral",
        goals=["Goal 1", "Goal 2"],
        message_count=0,
        personality_history=[],
        created_at=now,
        updated_at=now,
        capabilities=[cap1, cap2],
        agent_integrations=[integration_mock],
    )

    response = _build_agent_response(agent)

    assert response.id == agent.id
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
