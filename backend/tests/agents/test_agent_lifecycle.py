import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.domain.agents.models import AgentTemplate, Capability, Integration
from app.domain.agents.schemas import AgentCreate, AgentUpdate
from app.domain.agents.service import AgentService
from app.infrastructure.repositories.agent_repo import AgentRepository

_uuid_counter = 0


def get_deterministic_uuid() -> uuid.UUID:
    global _uuid_counter
    _uuid_counter += 1
    return uuid.UUID(f"00000000-0000-0000-0000-{_uuid_counter:012d}")


@pytest.mark.asyncio
async def test_create_agent_with_relations():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    await Capability.create(id="web_search", name="Web Search", description="desc", icon="icon")
    await Integration.create(
        id="discord", display_name="Discord", description="desc", icon="icon", config_schema={}
    )
    agent_data = AgentCreate(
        name="Test Agent",
        personality="Helpful",
        capabilities=["web_search"],
        integrations=["discord"],
        integration_configs={"discord": {"token": "123"}},
    )
    response = await service.create_agent(agent_data, user_id)
    assert response is not None
    assert response.name == "Test Agent"


@pytest.mark.asyncio
async def test_update_agent_success():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    await Capability.create(id="web_search2", name="Web Search", description="desc", icon="icon")
    await Capability.create(id="memory", name="Memory", description="desc", icon="icon")
    await Integration.create(
        id="discord2", display_name="Discord", description="desc", icon="icon", config_schema={}
    )
    await Integration.create(
        id="slack", display_name="Slack", description="desc", icon="icon", config_schema={}
    )
    agent_data = AgentCreate(
        name="Test Agent",
        personality="Helpful",
        capabilities=["web_search2"],
        integrations=["discord2"],
        integration_configs={"discord2": {"token": "123"}},
    )
    initial_agent = await service.create_agent(agent_data, user_id)
    update_data = AgentUpdate(
        name="Updated Agent",
        personality="Super Helpful",
        capabilities=["memory"],
        integrations=["slack"],
        integration_configs={"slack": {"token": "456"}},
    )
    response = await service.update_agent(str(initial_agent.id), user_id, update_data)
    assert response is not None
    assert response.name == "Updated Agent"


@pytest.mark.asyncio
async def test_update_agent_not_found():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    update_data = AgentUpdate(name="Non-existent")
    response = await service.update_agent(str(get_deterministic_uuid()), user_id, update_data)
    assert response is None


@pytest.mark.asyncio
async def test_update_agent_wrong_user():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    wrong_user_id = get_deterministic_uuid()
    agent_data = AgentCreate(name="Test Agent", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)
    update_data = AgentUpdate(name="Stolen Agent")
    response = await service.update_agent(str(initial_agent.id), wrong_user_id, update_data)
    assert response is None


@pytest.mark.asyncio
async def test_delete_agent():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    agent_data = AgentCreate(name="Agent To Delete", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)
    result = await service.delete_agent(str(initial_agent.id), user_id)
    assert result is True


@pytest.mark.asyncio
async def test_delete_agent_not_found():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    result = await service.delete_agent(str(get_deterministic_uuid()), user_id)
    assert result is False


@pytest.mark.asyncio
async def test_delete_agent_wrong_user():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    wrong_user_id = get_deterministic_uuid()
    agent_data = AgentCreate(name="Agent To Delete", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)
    result = await service.delete_agent(str(initial_agent.id), wrong_user_id)
    assert result is False


@pytest.mark.asyncio
async def test_list_templates():
    repo = AgentRepository()
    service = AgentService(repo)
    await AgentTemplate.create(
        id=get_deterministic_uuid(),
        name="Template 1",
        description="A template",
        personality="Helpful",
        goals=["Help users"],
    )
    templates = await service.list_templates(skip=0, limit=10)
    assert len(templates) > 0


@pytest.mark.asyncio
async def test_update_agent_no_capabilities_update():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    await Capability.create(id="web_search3", name="Web Search", description="desc", icon="icon")
    agent_data = AgentCreate(name="Test Agent", personality="Helpful", capabilities=["web_search3"])
    initial_agent = await service.create_agent(agent_data, user_id)
    update_data = AgentUpdate(name="Updated Agent")
    response = await service.update_agent(str(initial_agent.id), user_id, update_data)
    assert response is not None
    assert response.name == "Updated Agent"


@pytest.mark.asyncio
async def test_update_agent_repo_returns_none():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    agent_data = AgentCreate(name="Test Agent", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)
    with patch.object(repo, "update_agent", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = None
        update_data = AgentUpdate(name="Updated Agent")
        response = await service.update_agent(str(initial_agent.id), user_id, update_data)
        assert response is None


@pytest.mark.asyncio
async def test_list_agents():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    await service.create_agent(AgentCreate(name="Agent 1", personality="P1"), user_id)
    await service.create_agent(AgentCreate(name="Agent 2", personality="P2"), user_id)
    agents = await service.list_agents(user_id)
    assert len(agents) == 2


@pytest.mark.asyncio
async def test_create_agent_chaos_db_error():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    agent_data = AgentCreate(name="DB Error Agent", personality="Helpful")
    with patch("app.domain.agents.models.Agent.create", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = Exception("Database constraint violation")
        with pytest.raises(Exception, match="Database constraint violation"):
            await service.create_agent(agent_data, user_id)
