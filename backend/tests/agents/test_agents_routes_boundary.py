from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from app.api.dependencies import get_agent_service
from app.core.security.auth import get_current_user
from app.domain.agents.schemas import AgentResponse
from app.domain.agents.service import _build_agent_response
from app.main import app


def test_create_agent_route(client: TestClient) -> None:
    """Test the POST /api/v1/agents endpoint creates an agent successfully.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    now = datetime(2025, 1, 1, 12, 0)
    agent_response = AgentResponse(
        id=UUID("12345678-1234-5678-1234-567812345678"),
        name="Bot",
        personality="Friendly",
        description=None,
        system_prompt="system prompt",
        status="active",
        mood="Neutral",
        goals=[],
        capabilities=[],
        integrations=[],
        integration_configs={},
        message_count=0,
        created_at=now,
        updated_at=now,
    )

    mock_service.create_agent = AsyncMock(return_value=agent_response)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": "Bearer fake_token"},
        json={"name": "Bot", "personality": "Friendly"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Bot"
    app.dependency_overrides.clear()


def test_get_agents_route(client: TestClient) -> None:
    """Test the GET /api/v1/agents endpoint retrieves agents successfully.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    mock_service.list_agents = AsyncMock(return_value=[])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.get("/api/v1/agents", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert response.json() == []
    app.dependency_overrides.clear()


def test_build_agent_response_without_avatar() -> None:
    """Test that agent response is built correctly without an avatar_url field.

    Returns:
        None
    """
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

    assert response.id == agent.pk
    assert response.name == "Test Agent"
    assert response.personality == "Test Personality"
    assert response.description == "Test Description"
    assert response.system_prompt == "Test Prompt"
    assert response.status == "active"
    assert response.mood == "Neutral"
    assert response.goals == ["Goal 1", "Goal 2"]
    assert len(response.capabilities) == 2
    assert response.capabilities[0] == "cap1"
    assert response.capabilities[1] == "cap2"
    assert len(response.integrations) == 1
    assert response.integrations[0] == "steam"
    assert response.message_count == 0
    assert response.created_at == now
    assert response.updated_at == now


@pytest.mark.asyncio
async def test_agent_service_caching() -> None:
    """Test that agent capabilities and integrations caching behavior functions correctly.

    Returns:
        None
    """
    from app.domain.agents.models import Capability, Integration
    from app.domain.agents.service import AgentService

    mock_repo = MagicMock()
    mock_repo.list_capabilities = AsyncMock(return_value=[Capability(id="cap1", name="Cap 1")])
    mock_repo.list_integrations = AsyncMock(return_value=[Integration(id="int1", type="Int 1")])

    service = AgentService(repo=mock_repo)

    caps1 = await service.list_capabilities()
    ints1 = await service.list_integrations()

    assert len(caps1) == 1
    assert len(ints1) == 1
    mock_repo.list_capabilities.assert_called_once()
    mock_repo.list_integrations.assert_called_once()

    caps2 = await service.list_capabilities()
    ints2 = await service.list_integrations()

    assert caps2 == caps1
    assert ints2 == ints1
    mock_repo.list_capabilities.assert_called_once()
    mock_repo.list_integrations.assert_called_once()


def test_create_agent_route_contract(client: TestClient) -> None:
    """Test the POST /api/v1/agents endpoint payload contract schema.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    from app.domain.agents.schemas import AgentResponse

    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")
    agent_id = UUID("12345678-1234-5678-1234-567812345678")

    now = datetime(2025, 1, 1, 12, 0)
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

    parsed_response = AgentResponse.model_validate(response.json())
    assert parsed_response.id == agent_id
    app.dependency_overrides.clear()


def test_list_capabilities_route(client: TestClient) -> None:
    """Test the GET /api/v1/agents/capabilities endpoint retrieves data successfully.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    mock_service.list_capabilities = AsyncMock(return_value=[])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.get(
        "/api/v1/agents/capabilities", headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    assert response.json() == []
    app.dependency_overrides.clear()


def test_list_integrations_route(client: TestClient) -> None:
    """Test the GET /api/v1/agents/integrations endpoint retrieves data successfully.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    mock_service.list_integrations = AsyncMock(return_value=[])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.get(
        "/api/v1/agents/integrations", headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    assert response.json() == []
    app.dependency_overrides.clear()


def test_list_templates_route(client: TestClient) -> None:
    """Test the GET /api/v1/agents/templates endpoint retrieves data successfully.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    mock_service.list_templates = AsyncMock(return_value=[])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.get(
        "/api/v1/agents/templates", headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    assert response.json() == []
    app.dependency_overrides.clear()


def test_generate_agent_route(client: TestClient) -> None:
    """Test the POST /api/v1/agents/generate endpoint returns correct generated schemas.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    from app.domain.agents.schemas import AgentGenerationResponse

    mock_response = AgentGenerationResponse(
        name="Gen Agent",
        personality="Fun",
        description="A gen agent",
        capabilities=["web_search"],
        suggested_integrations=["discord"],
        goals=["Be helpful"],
    )

    mock_service.generate_agent_profile = AsyncMock(return_value=mock_response)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={"keywords": "A fun agent"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Gen Agent"
    app.dependency_overrides.clear()


def test_update_agent_route_success(client: TestClient) -> None:
    """Test the PATCH /api/v1/agents/{agent_id} endpoint handles updates.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")
    agent_id = UUID("87654321-4321-8765-4321-876543210987")

    from app.domain.agents.schemas import AgentResponse

    now = datetime(2025, 1, 1, 12, 0)
    agent_response = AgentResponse(
        id=agent_id,
        name="Updated Agent",
        personality="Updated Personality",
        description="A bot",
        system_prompt="You are a bot.",
        status="active",
        mood="Neutral",
        goals=["Goal A"],
        capabilities=[],
        integrations=[],
        integration_configs={},
        message_count=5,
        created_at=now,
        updated_at=now,
    )

    mock_service.update_agent = AsyncMock(return_value=agent_response)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.patch(
        f"/api/v1/agents/{agent_id}",
        headers={"Authorization": "Bearer fake_token"},
        json={"name": "Updated Agent"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Agent"
    app.dependency_overrides.clear()


def test_update_agent_route_not_found(client: TestClient) -> None:
    """Test the PATCH /api/v1/agents/{agent_id} endpoint handles missing agents appropriately.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")
    agent_id = UUID("87654321-4321-8765-4321-876543210987")

    mock_service.update_agent = AsyncMock(return_value=None)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.patch(
        f"/api/v1/agents/{agent_id}",
        headers={"Authorization": "Bearer fake_token"},
        json={"name": "Updated Agent"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["error"] == "agent_not_found"
    app.dependency_overrides.clear()


def test_delete_agent_route_success(client: TestClient) -> None:
    """Test the DELETE /api/v1/agents/{agent_id} endpoint deletes an agent.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")
    agent_id = UUID("87654321-4321-8765-4321-876543210987")

    mock_service.delete_agent = AsyncMock(return_value=True)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.delete(
        f"/api/v1/agents/{agent_id}",
        headers={"Authorization": "Bearer fake_token"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    app.dependency_overrides.clear()


def test_delete_agent_route_not_found(client: TestClient) -> None:
    """Test the DELETE /api/v1/agents/{agent_id} endpoint handles missing agents correctly.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")
    agent_id = UUID("87654321-4321-8765-4321-876543210987")

    mock_service.delete_agent = AsyncMock(return_value=False)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.delete(
        f"/api/v1/agents/{agent_id}",
        headers={"Authorization": "Bearer fake_token"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["error"] == "agent_not_found"
    app.dependency_overrides.clear()


def test_delete_agent_chaos_invalid_uuid(client: TestClient) -> None:
    """Test that DELETE requests with invalid UUID formats throw HTTP 422 immediately.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.delete(
        "/api/v1/agents/invalid-uuid-format",
        headers={"Authorization": "Bearer fake_token"},
    )

    assert response.status_code == 422
    app.dependency_overrides.clear()


def test_generate_agent_chaos_missing_keywords(client: TestClient) -> None:
    """Test that POST /api/v1/agents/generate validates missing payload structure strictly.

    Args:
        client: The test client instance.

    Returns:
        None
    """
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.post(
        "/api/v1/agents/generate",
        headers={"Authorization": "Bearer fake_token"},
        json={},
    )

    assert response.status_code == 422
    app.dependency_overrides.clear()
