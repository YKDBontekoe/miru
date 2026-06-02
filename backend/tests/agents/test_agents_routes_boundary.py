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


def test_create_agent_route(client: TestClient) -> None:
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

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

    assert response.name == "Test Agent"


@pytest.mark.asyncio
async def test_agent_service_caching() -> None:
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


def test_list_capabilities_route(client: TestClient) -> None:
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


def test_list_integrations_route(client: TestClient) -> None:
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


def test_list_templates_route(client: TestClient) -> None:
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


def test_generate_agent_route(client: TestClient) -> None:
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


def test_update_agent_route_success(client: TestClient) -> None:
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


def test_update_agent_route_not_found(client: TestClient) -> None:
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


def test_delete_agent_route_success(client: TestClient) -> None:
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


def test_delete_agent_route_not_found(client: TestClient) -> None:
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


def test_delete_agent_chaos_invalid_uuid(client: TestClient) -> None:
    mock_service = MagicMock()
    user_id = UUID("12345678-1234-5678-1234-567812345678")

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_agent_service] = lambda: mock_service

    response = client.delete(
        "/api/v1/agents/invalid-uuid-format",
        headers={"Authorization": "Bearer fake_token"},
    )

    assert response.status_code == 422


def test_generate_agent_chaos_missing_keywords(client: TestClient) -> None:
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
