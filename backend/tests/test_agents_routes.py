from __future__ import annotations

from collections.abc import Generator
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_agent_service
from app.core.security.auth import get_current_user
from app.domain.agents.models import Agent, AgentGenerationResponse
from app.domain.agents.service import AgentService, _build_agent_response
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


@pytest.mark.asyncio
async def test_agent_service_caching() -> None:
    from app.domain.agents.models import Capability, Integration

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


@pytest.mark.asyncio
async def test_generate_agent_profile_service_with_language():
    with patch("app.domain.agents.service.structured_completion") as mock_completion:
        mock_completion.return_value = AgentGenerationResponse(
            name="Gen", personality="Gen", description="Gen", goals=[]
        )
        service = AgentService(repo=MagicMock())
        await service.generate_agent_profile("test keywords", accept_language="es-ES")

        mock_completion.assert_called_once()
        kwargs = mock_completion.call_args.kwargs
        assert kwargs.get("accept_language") == "es-ES"
        assert kwargs["response_model"] == AgentGenerationResponse
        assert "Keywords: test keywords" in kwargs["messages"][1]["content"]


@pytest.mark.asyncio
async def test_generate_agent_profile_service_with_language_direct():
    service = AgentService(repo=MagicMock())

    with patch("app.domain.agents.service.structured_completion") as mock_completion:
        mock_completion.return_value = AgentGenerationResponse(
            name="Gen", personality="Gen", description="Gen", goals=[]
        )

        # Test directly calling the method
        result = await service.generate_agent_profile("test keywords", accept_language="es-ES")

        assert result.name == "Gen"
        mock_completion.assert_called_once()
        kwargs = mock_completion.call_args.kwargs
        assert kwargs.get("accept_language") == "es-ES"
        assert "Keywords: test keywords" in kwargs["messages"][1]["content"]


@pytest.mark.asyncio
async def test_generate_agent_profile_service_no_language():
    with patch("app.domain.agents.service.structured_completion") as mock_completion:
        mock_completion.return_value = AgentGenerationResponse(
            name="Gen", personality="Gen", description="Gen", goals=[]
        )
        service = AgentService(repo=MagicMock())
        await service.generate_agent_profile("test keywords")

        mock_completion.assert_called_once()
        kwargs = mock_completion.call_args.kwargs
        assert kwargs.get("accept_language") is None
        assert kwargs["response_model"] == AgentGenerationResponse
        assert "Keywords: test keywords" in kwargs["messages"][1]["content"]
