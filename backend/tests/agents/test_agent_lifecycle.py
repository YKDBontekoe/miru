import pytest
from uuid import UUID
from datetime import UTC, datetime
from app.domain.agents.service import AgentService
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.domain.agents.models import Agent, Capability, AgentIntegration, Integration
from app.domain.agents.schemas import AgentCreate, AgentUpdate, MoodResponse

# [Truncated mock logic since we just need to append]


@pytest.mark.asyncio
async def test_update_agent_no_capabilities_prefetched_n_plus_1():
    """Verify that update_agent falls back safely if capabilities aren't prefetched."""
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    await Capability.create(id="web_search_n1", name="Web Search", description="desc", icon="icon")
    agent_data = AgentCreate(name="Test Agent N1", personality="Helpful", capabilities=["web_search_n1"])
    initial_agent = await service.create_agent(agent_data, user_id)

    # Intentionally bypass repo to get an agent without prefetched capabilities
    raw_agent = await Agent.get(id=initial_agent.id)
    assert getattr(raw_agent.capabilities, "_fetched", False) is False

    # Mock repo to return raw_agent
    from unittest.mock import patch
    with patch.object(repo, "get_by_id", return_value=raw_agent):
        update_data = AgentUpdate(name="Updated Agent N1")
        response = await service.update_agent(str(initial_agent.id), user_id, update_data)

    assert response is not None
    assert response.name == "Updated Agent N1"

@pytest.mark.asyncio
async def test_update_agent_no_capabilities_prefetched_n_plus_1():
    """Verify that update_agent falls back safely if capabilities aren't prefetched."""
    import uuid
    get_deterministic_uuid = lambda index=1: uuid.UUID(int=index)
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    await Capability.create(id="web_search_n1", name="Web Search", description="desc", icon="icon")
    agent_data = AgentCreate(name="Test Agent N1", personality="Helpful", capabilities=["web_search_n1"])
    initial_agent = await service.create_agent(agent_data, user_id)

    # Intentionally bypass repo to get an agent without prefetched capabilities
    raw_agent = await Agent.get(id=initial_agent.id)
    assert getattr(raw_agent.capabilities, "_fetched", False) is False

    # Mock repo to return raw_agent
    from unittest.mock import patch
    with patch.object(repo, "get_by_id", return_value=raw_agent):
        update_data = AgentUpdate(name="Updated Agent N1")
        response = await service.update_agent(str(initial_agent.id), user_id, update_data)

    assert response is not None
    assert response.name == "Updated Agent N1"
