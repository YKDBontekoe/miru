"""
1. Target: backend/app/domain/agents/service.py and backend/app/api/v1/agents.py
2. Test Code: The complete, runnable test file using Miru Test Standards.
3. Coverage Explanation:
   - `test_agent_creation_success`: Verifies happy path for Agent API Boundary contract and Application Use Case.
   - `test_agent_creation_validates_name_length`: Tests validation logic (boundary level).
   - `test_agent_update_success`: Verifies that side-effects reflect correctly in the database.
   - `test_agent_delete_success`: Asserts database side-effect after deletion.
   - `test_agent_update_fails_when_user_does_not_own_agent` (Chaos): Ensures strict Authorization boundary checks.
   - `test_agent_creation_fails_when_db_down` (Chaos): Simulates a DB exception during creation to verify error handling behavior.
"""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from tortoise.exceptions import DBConnectionError

from app.domain.agents.models import Agent, Capability, Integration
from app.main import app

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def async_client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def seed_capabilities() -> list[Capability]:
    caps = [
        Capability(id="web_search", name="Web Search", description="Search the web", icon="search"),
        Capability(id="memory", name="Memory", description="Remember things", icon="brain"),
    ]
    await Capability.bulk_create(caps)
    return caps


async def seed_integrations() -> list[Integration]:
    ints = [
        Integration(
            id="steam",
            display_name="Steam",
            description="Steam Games",
            icon="steam",
            config_schema={},
        ),
    ]
    await Integration.bulk_create(ints)
    return ints


async def test_agent_creation_success(
    async_client: AsyncClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    # Arrange
    await seed_capabilities()
    await seed_integrations()
    payload = {
        "name": "TestBot",
        "personality": "Helpful and polite",
        "description": "A testing bot",
        "capabilities": ["web_search"],
        "integrations": ["steam"],
        "integration_configs": {"steam": {"steam_id": "12345"}},
    }

    # Act
    response = await async_client.post("/api/v1/agents", headers=authed_headers, json=payload)

    # Assert API Boundary Response
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "TestBot"
    assert "web_search" in data["capabilities"]
    assert "steam" in data["integrations"]

    # Assert DB Side Effect
    agent_id = data["id"]
    db_agent = await Agent.get_or_none(id=agent_id).prefetch_related(
        "capabilities", "agent_integrations"
    )
    assert db_agent is not None
    assert db_agent.name == "TestBot"
    assert db_agent.personality == "Helpful and polite"
    assert str(db_agent.user_id) == test_user_id

    # Verify relations
    db_caps = await db_agent.capabilities.all()
    assert len(db_caps) == 1
    assert db_caps[0].id == "web_search"

    db_ints = await db_agent.agent_integrations.all()
    assert len(db_ints) == 1
    assert db_ints[0].integration_id == "steam"
    assert db_ints[0].config == {"steam_id": "12345"}


async def test_agent_creation_validates_name_length(
    async_client: AsyncClient, authed_headers: dict[str, str]
) -> None:
    # Arrange
    payload = {
        "name": "",  # Invalid: min_length=1
        "personality": "Friendly",
    }

    # Act
    response = await async_client.post("/api/v1/agents", headers=authed_headers, json=payload)

    # Assert API Boundary Contract Validation
    assert response.status_code == 422
    assert "String should have at least 1 character" in response.text


async def test_agent_update_success(
    async_client: AsyncClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    # Arrange
    await seed_capabilities()
    agent = await Agent.create(
        user_id=uuid.UUID(test_user_id),
        name="OldName",
        personality="Old",
    )
    payload = {"name": "NewName", "capabilities": ["memory"]}

    # Act
    response = await async_client.patch(
        f"/api/v1/agents/{agent.id}", headers=authed_headers, json=payload
    )

    # Assert
    assert response.status_code == 200, response.text
    db_agent = await Agent.get(id=agent.id).prefetch_related("capabilities")
    assert db_agent.name == "NewName"
    assert db_agent.personality == "Old"  # Should remain unchanged

    db_caps = await db_agent.capabilities.all()
    assert len(db_caps) == 1
    assert db_caps[0].id == "memory"


async def test_agent_delete_success(
    async_client: AsyncClient, authed_headers: dict[str, str], test_user_id: str
) -> None:
    # Arrange
    agent = await Agent.create(
        user_id=uuid.UUID(test_user_id),
        name="ToDelete",
        personality="Sad",
    )

    # Act
    response = await async_client.delete(f"/api/v1/agents/{agent.id}", headers=authed_headers)

    # Assert
    assert response.status_code == 200
    db_agent = await Agent.get(id=agent.id)
    assert db_agent.deleted_at is not None


async def test_agent_update_fails_when_user_does_not_own_agent(
    async_client: AsyncClient, authed_headers: dict[str, str]
) -> None:
    # Chaos / Security Boundary: Update an agent that belongs to someone else
    # Arrange
    other_user_id = uuid.uuid4()
    agent = await Agent.create(
        user_id=other_user_id,
        name="OtherUserBot",
        personality="Secretive",
    )
    payload = {"name": "HackedName"}

    # Act
    response = await async_client.patch(
        f"/api/v1/agents/{agent.id}", headers=authed_headers, json=payload
    )

    # Assert
    assert response.status_code == 404

    # DB unchanged
    db_agent = await Agent.get(id=agent.id)
    assert db_agent.name == "OtherUserBot"


async def test_agent_creation_fails_when_db_down(
    async_client: AsyncClient, authed_headers: dict[str, str]
) -> None:
    # Chaos: Database connection fails during save
    # Arrange
    payload = {
        "name": "Bot2",
        "personality": "Nice",
    }

    # Act
    with (
        patch(
            "app.domain.agents.models.Agent.create",
            side_effect=DBConnectionError("Connection lost"),
        ),
        pytest.raises(DBConnectionError),
    ):
        # The FastAPI app might or might not handle DBConnectionError globally.
        # Usually it raises a 500, or in tests the exception bubbles up.
        await async_client.post("/api/v1/agents", headers=authed_headers, json=payload)

    # Assert Side effect (nothing inserted)
    db_agents = await Agent.all()
    assert len(db_agents) == 0
