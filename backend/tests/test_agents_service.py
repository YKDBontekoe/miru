from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.domain.agents.models import Agent, AgentIntegration, AgentTemplate, Capability, Integration
from app.domain.agents.schemas import (
    AgentCreate,
    AgentGenerationResponse,
    AgentUpdate,
    MoodResponse,
)
from app.domain.agents.service import AgentService
from app.infrastructure.repositories.agent_repo import AgentRepository

_uuid_counter = 0


def get_deterministic_uuid() -> uuid.UUID:
    global _uuid_counter
    _uuid_counter += 1
    return uuid.UUID(f"00000000-0000-0000-0000-{_uuid_counter:012d}")


@pytest.mark.asyncio
async def test_update_mood_empty_history():
    repo = AsyncMock()
    service = AgentService(repo)

    await service.update_mood(str(get_deterministic_uuid()), "")
    repo.update_mood.assert_not_called()


@pytest.mark.asyncio
async def test_update_mood_success():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(get_deterministic_uuid())

    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.return_value = MoodResponse(mood="Happy")

        await service.update_mood(agent_id, "User said something nice")

        mock_completion.assert_called_once()
        repo.update_mood.assert_called_once_with(agent_id, "Happy")


@pytest.mark.asyncio
async def test_update_mood_invalid_mood():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(get_deterministic_uuid())

    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.return_value = MoodResponse(mood="UnknownMood")

        await service.update_mood(agent_id, "User said something weird")

        mock_completion.assert_called_once()
        repo.update_mood.assert_called_once_with(agent_id, "Neutral")


@pytest.mark.asyncio
async def test_update_mood_exception():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(get_deterministic_uuid())

    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.side_effect = Exception("API Error")
        await service.update_mood(agent_id, "User said something")
        repo.update_mood.assert_not_called()


@pytest.mark.asyncio
async def test_create_agent_with_relations():
    # Arrange
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

    # Act
    response = await service.create_agent(agent_data, user_id)

    # Assert
    assert response.name == "Test Agent"
    assert "web_search" in response.capabilities
    assert "discord" in response.integrations
    assert response.integration_configs.get("discord") == {"token": "123"}

    # Verify DB directly
    db_agent = await Agent.get(pk=response.id).prefetch_related(
        "capabilities", "agent_integrations"
    )
    assert db_agent.name == "Test Agent"
    assert db_agent.system_prompt is not None
    assert "You are Test Agent" in db_agent.system_prompt

    db_caps = [c.pk for c in db_agent.capabilities]
    assert "web_search" in db_caps

    db_integrations = await AgentIntegration.filter(agent=db_agent).prefetch_related("integration")
    assert len(db_integrations) == 1
    assert db_integrations[0].integration.pk == "discord"
    assert db_integrations[0].config == {"token": "123"}


@pytest.mark.asyncio
async def test_generate_agent_profile():
    repo = AsyncMock()
    service = AgentService(repo)

    mock_response = AgentGenerationResponse(
        name="Generated Agent",
        personality="Creative",
        description="A generated agent",
        capabilities=["web_search"],
        suggested_integrations=["discord"],
        goals=["Create art"],
    )

    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.return_value = mock_response

        response = await service.generate_agent_profile("creative artist")

        mock_completion.assert_called_once()
        assert response.name == "Generated Agent"
        assert response.personality == "Creative"
        assert "web_search" in response.capabilities
        assert "discord" in response.suggested_integrations


@pytest.mark.asyncio
async def test_update_agent_success():
    # Arrange
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

    # Create initial agent
    agent_data = AgentCreate(
        name="Test Agent",
        personality="Helpful",
        capabilities=["web_search2"],
        integrations=["discord2"],
        integration_configs={"discord2": {"token": "123"}},
    )
    initial_agent = await service.create_agent(agent_data, user_id)

    # Act
    update_data = AgentUpdate(
        name="Updated Agent",
        personality="Super Helpful",
        capabilities=["memory"],
        integrations=["slack"],
        integration_configs={"slack": {"token": "456"}},
    )

    response = await service.update_agent(str(initial_agent.id), user_id, update_data)

    # Assert
    assert response is not None
    assert response.name == "Updated Agent"
    assert response.personality == "Super Helpful"
    assert "memory" in response.capabilities
    assert "web_search2" not in response.capabilities
    assert "slack" in response.integrations
    assert "discord2" not in response.integrations
    assert response.integration_configs.get("slack") == {"token": "456"}

    # Verify DB directly
    db_agent = await Agent.get(pk=response.id).prefetch_related(
        "capabilities", "agent_integrations"
    )
    assert db_agent.name == "Updated Agent"
    assert db_agent.personality == "Super Helpful"

    db_caps = [c.pk for c in db_agent.capabilities]
    assert "memory" in db_caps
    assert "web_search2" not in db_caps

    db_integrations = await AgentIntegration.filter(agent=db_agent).prefetch_related("integration")
    assert len(db_integrations) == 1
    assert db_integrations[0].integration.pk == "slack"
    assert db_integrations[0].config == {"token": "456"}


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

    # Verify not changed in DB
    db_agent = await Agent.get(pk=initial_agent.id)
    assert db_agent.name == "Test Agent"


@pytest.mark.asyncio
async def test_delete_agent():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()

    # Create agent
    agent_data = AgentCreate(name="Agent To Delete", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)

    # Verify in DB
    db_agent = await Agent.get(pk=initial_agent.id)
    assert db_agent.status == "active"

    # Act
    result = await service.delete_agent(str(initial_agent.id), user_id)

    # Assert
    assert result is True

    # Verify DB directly (soft delete or hard delete depending on implementation)
    # The repository performs soft delete by setting status="deleted"
    db_agent_deleted = await Agent.get(pk=initial_agent.id)
    assert db_agent_deleted.deleted_at is not None


@pytest.mark.asyncio
async def test_delete_agent_not_found():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()

    # Act
    result = await service.delete_agent(str(get_deterministic_uuid()), user_id)

    # Assert
    assert result is False


@pytest.mark.asyncio
async def test_delete_agent_wrong_user():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()
    wrong_user_id = get_deterministic_uuid()

    # Create agent
    agent_data = AgentCreate(name="Agent To Delete", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)

    # Act
    result = await service.delete_agent(str(initial_agent.id), wrong_user_id)

    # Assert
    assert result is False

    # Verify not deleted in DB
    db_agent = await Agent.get(pk=initial_agent.id)
    assert db_agent.status == "active"


@pytest.mark.asyncio
async def test_list_templates():
    repo = AgentRepository()
    service = AgentService(repo)

    # Seed DB with template
    template = await AgentTemplate.create(
        id=get_deterministic_uuid(),
        name="Template 1",
        description="A template",
        personality="Helpful",
        goals=["Help users"],
    )

    # Act
    templates = await service.list_templates(skip=0, limit=10)

    # Assert
    assert len(templates) > 0

    # Verify DB directly
    db_templates = await AgentTemplate.all()
    assert len(db_templates) > 0
    assert any(t.id == template.id for t in db_templates)

    # Check returned properties
    returned_template = next(t for t in templates if t.id == template.id)
    assert returned_template.name == "Template 1"
    assert returned_template.description == "A template"
    assert returned_template.personality == "Helpful"
    assert returned_template.goals == ["Help users"]


@pytest.mark.asyncio
async def test_update_agent_no_capabilities_update():
    # Arrange
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()

    await Capability.create(id="web_search3", name="Web Search", description="desc", icon="icon")

    # Create initial agent
    agent_data = AgentCreate(name="Test Agent", personality="Helpful", capabilities=["web_search3"])
    initial_agent = await service.create_agent(agent_data, user_id)

    # Act: Update without providing capabilities
    update_data = AgentUpdate(name="Updated Agent")

    response = await service.update_agent(str(initial_agent.id), user_id, update_data)

    # Assert
    assert response is not None
    assert response.name == "Updated Agent"
    assert "web_search3" in response.capabilities


@pytest.mark.asyncio
async def test_update_agent_repo_returns_none():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()

    # Create initial agent
    agent_data = AgentCreate(name="Test Agent", personality="Helpful")
    initial_agent = await service.create_agent(agent_data, user_id)

    # Mock repo.update_agent to return None
    with patch.object(repo, "update_agent", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = None

        update_data = AgentUpdate(name="Updated Agent")
        response = await service.update_agent(str(initial_agent.id), user_id, update_data)

        assert response is None


@pytest.mark.asyncio
async def test_build_system_prompt_with_goals():
    repo = AgentRepository()
    service = AgentService(repo)

    prompt = await service.build_system_prompt(
        name="Bot", personality="Friendly", goals=["Help users", "Be nice"]
    )

    assert "Your Goals:" in prompt
    assert "- Help users" in prompt
    assert "- Be nice" in prompt


@pytest.mark.asyncio
async def test_list_agents():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()

    # Create agents
    await service.create_agent(AgentCreate(name="Agent 1", personality="P1"), user_id)
    await service.create_agent(AgentCreate(name="Agent 2", personality="P2"), user_id)

    # Act
    agents = await service.list_agents(user_id)

    # Assert
    assert len(agents) == 2
    assert {"Agent 1", "Agent 2"} == {a.name for a in agents}


@pytest.mark.asyncio
async def test_build_system_prompt_with_description():
    repo = AgentRepository()
    service = AgentService(repo)

    prompt = await service.build_system_prompt(
        name="Bot", personality="Friendly", description="A super cool bot"
    )

    assert "A super cool bot" in prompt


@pytest.mark.asyncio
async def test_generate_agent_profile_chaos_timeout():
    repo = AsyncMock()
    service = AgentService(repo)

    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.side_effect = TimeoutError("LLM API Timeout")

        with pytest.raises(TimeoutError):
            await service.generate_agent_profile("impossible keywords")

        mock_completion.assert_called_once()


@pytest.mark.asyncio
async def test_create_agent_chaos_db_error():
    repo = AgentRepository()
    service = AgentService(repo)
    user_id = get_deterministic_uuid()

    agent_data = AgentCreate(name="DB Error Agent", personality="Helpful")

    # Simulate DB error during insert
    with patch("app.domain.agents.models.Agent.create", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = Exception("Database constraint violation")

        with pytest.raises(Exception, match="Database constraint violation"):
            await service.create_agent(agent_data, user_id)

        mock_create.assert_called_once()
