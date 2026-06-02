from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app.domain.agents.models import Agent, AgentTemplate, Capability, Integration
from app.domain.agents.schemas import (
    AgentResponse,
    AgentTemplateResponse,
    CapabilityResponse,
    IntegrationResponse,
)
from app.main import app

# We use httpx.AsyncClient with ASGITransport instead of TestClient to avoid asyncio loop issues with nested calls in Tortoise ORM


@pytest.mark.asyncio
async def test_capabilities_integration(authed_headers: dict) -> None:
    # Setup - real data
    await Capability.create(id="test_cap", name="Test Cap", description="Test Cap", icon="icon")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/agents/capabilities", headers=authed_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Contract validation without loops
    parsed = CapabilityResponse.model_validate(data[0])
    assert parsed.id == data[0]["id"]


@pytest.mark.asyncio
async def test_integrations_integration(authed_headers: dict) -> None:
    # Setup
    await Integration.create(
        id="test_int",
        display_name="Test Int",
        description="Test Int",
        icon="icon",
        config_schema={},
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/agents/integrations", headers=authed_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Contract validation without loops
    parsed = IntegrationResponse.model_validate(data[0])
    assert parsed.id == data[0]["id"]


@pytest.mark.asyncio
async def test_templates_integration(authed_headers: dict) -> None:
    # Setup
    from uuid import uuid4

    await AgentTemplate.create(
        id=uuid4(), name="Test Temp", description="Test Temp", personality="Fun", goals=[]
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/agents/templates", headers=authed_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Contract validation without loops
    parsed = AgentTemplateResponse.model_validate(data[0])
    assert str(parsed.id) == data[0]["id"]


@pytest.mark.asyncio
async def test_create_agent_integration(authed_headers: dict, test_user_id: str) -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        create_payload = {
            "name": "Integration Bot Create",
            "personality": "Helpful",
            "description": "Integration test bot",
            "goals": ["pass the test"],
            "capabilities": [],
            "integrations": [],
            "integration_configs": {},
        }
        response = await client.post("/api/v1/agents", headers=authed_headers, json=create_payload)

    assert response.status_code == 200

    # Validate contract
    parsed = AgentResponse.model_validate(response.json())
    assert parsed.name == "Integration Bot Create"

    # Verify side-effect by querying real DB
    db_agent = await Agent.get_or_none(name="Integration Bot Create")
    assert db_agent is not None
    assert str(db_agent.user_id) == test_user_id


@pytest.mark.asyncio
async def test_list_agents_integration(authed_headers: dict, test_user_id: str) -> None:
    from uuid import uuid4

    # Seed Database
    await Agent.create(
        id=uuid4(), user_id=UUID(test_user_id), name="List Bot", personality="Fun", goals=[]
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/agents", headers=authed_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    # Verify contract directly on first returned item without loop
    parsed = AgentResponse.model_validate(data[0])
    assert isinstance(parsed.id, UUID)


@pytest.mark.asyncio
async def test_update_agent_integration(authed_headers: dict, test_user_id: str) -> None:
    from uuid import uuid4

    # Seed Database
    agent_id = uuid4()
    await Agent.create(
        id=agent_id, user_id=UUID(test_user_id), name="Old Name", personality="Fun", goals=[]
    )

    update_payload = {"name": "New Name"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/agents/{agent_id}", headers=authed_headers, json=update_payload
        )

    assert response.status_code == 200

    # Verify side effect directly via DB
    db_agent = await Agent.get_or_none(id=agent_id)
    assert db_agent is not None
    assert db_agent.name == "New Name"


@pytest.mark.asyncio
async def test_delete_agent_integration(authed_headers: dict, test_user_id: str) -> None:
    from uuid import uuid4

    # Seed Database
    agent_id = uuid4()
    await Agent.create(
        id=agent_id, user_id=UUID(test_user_id), name="To Delete", personality="Fun", goals=[]
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete(f"/api/v1/agents/{agent_id}", headers=authed_headers)

    assert response.status_code == 200

    # Verify side effect directly via DB - since soft delete is used in repo, check if deleted_at is set or if list_by_user omits it. Wait, the domain logic uses a soft delete!
    db_agent = await Agent.get_or_none(id=agent_id)
    assert db_agent is not None
    assert db_agent.deleted_at is not None
