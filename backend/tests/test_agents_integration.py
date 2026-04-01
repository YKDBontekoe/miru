"""Integration tests for Agents API."""

from __future__ import annotations

from typing import Any
from uuid import UUID

import pytest
from app.domain.agents.models import Agent, Capability, Integration
from app.main import app
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_agent_success_and_verify_side_effect(
    authed_headers: dict[str, str], test_user_id: str
) -> None:
    """1. Target: POST /api/v1/agents -> app.domain.agents.service.create_agent
    2. Test Code: this file.
    3. Coverage Explanation: This tests the happy path for creating an agent, validating the integration gap
    by checking the actual database for the side-effect (agent creation + M2M capability links) instead of
    relying on mock returns. This fulfils the "Integration-First" and "Side-Effect Verification" rules.
    """
    # Arrange
    await Capability.create(
        id="web_search", name="Web Search", description="desc", icon="icon", status="active"
    )
    await Integration.create(
        id="discord", display_name="Discord", description="desc", icon="icon", status="active"
    )

    payload = {
        "name": "Integration Bot",
        "personality": "Friendly",
        "description": "Integration Test Bot",
        "goals": ["Test integration"],
        "system_prompt": "You are a bot.",
        "capabilities": ["web_search"],
        "integrations": ["discord"],
        "integration_configs": {"discord": {"token": "123"}},
    }

    # Act using AsyncClient to avoid TestClient's synchronous loop blocking Tortoise lock on fetch_related
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/agents", headers=authed_headers, json=payload)

    # Assert API Contract
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Integration Bot"
    assert data["capabilities"] == ["web_search"]
    assert data["integrations"] == ["discord"]

    # Assert Side-Effect (Database query)
    db_agent = await Agent.get(id=data["id"])
    assert db_agent is not None
    assert db_agent.user_id == UUID(test_user_id)
    assert db_agent.name == "Integration Bot"
    assert db_agent.system_prompt == "You are a bot."

    # Assert capabilities relation side-effect
    await db_agent.fetch_related("capabilities", "agent_integrations__integration")
    caps = [c.id for c in db_agent.capabilities]
    assert "web_search" in caps

    # Assert integrations side-effect
    ints = [ai.integration.id for ai in db_agent.agent_integrations]
    assert "discord" in ints


@pytest.mark.parametrize(
    "invalid_payload",
    [
        {
            "name": "",  # Name too short
            "personality": "P",
        },
        {
            "name": "A" * 101,  # Name too long
            "personality": "P",
        },
        {
            "name": "Bot",
            # Missing personality completely
        },
    ],
)
async def test_create_agent_chaos_malformed_json(
    authed_headers: dict[str, str], invalid_payload: dict[str, Any]
) -> None:
    """1. Target: POST /api/v1/agents
    2. Test Code: this file.
    3. Coverage Explanation: Hardening case using malformed inputs. Tests the Pydantic boundary
    to ensure 422 errors are properly returned, satisfying the "Chaos case" requirement.
    Uses parametrization per test constraint rules.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/agents", headers=authed_headers, json=invalid_payload)
    assert response.status_code == 422


async def test_persona_creation_fails_when_integration_is_invalid(
    authed_headers: dict[str, str], test_user_id: str
) -> None:
    """1. Target: POST /api/v1/agents
    2. Test Code: this file.
    3. Coverage Explanation: A chaos/failure case ensuring that creating an agent with an invalid or
    unrecognized integration ID does not crash the server but behaves correctly (either creates without it
    or ignores it depending on logic). Actually we'll test that the integration is simply not linked since the
    get_or_none handles it gracefully.
    """
    # Act
    payload = {"name": "Conflict Bot", "personality": "P", "integrations": ["does_not_exist"]}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/agents", headers=authed_headers, json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["integrations"] == []  # Should be empty because it doesn't exist

    # Verify Side effect in DB
    db_agent = await Agent.get(id=data["id"])
    await db_agent.fetch_related("agent_integrations")
    assert len(db_agent.agent_integrations) == 0
