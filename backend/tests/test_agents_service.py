from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.domain.agents.models import Agent, AgentCreate, Integration
from app.domain.agents.service import AgentService
from app.infrastructure.repositories.agent_repo import AgentRepository


@pytest.mark.asyncio
async def test_create_agent_with_integrations() -> None:
    """Test creating an agent with integrations to cover the optimized logic."""
    # Arrange
    mock_repo = MagicMock(spec=AgentRepository)
    # Mocking get_by_id to return a model with the necessary fields for _build_agent_response
    mock_agent = MagicMock()
    mock_agent.pk = uuid4()
    mock_agent.user_id = uuid4()
    mock_agent.name = "Test Agent"
    mock_agent.personality = "Test Personality"
    mock_agent.description = None
    mock_agent.system_prompt = "Prompt"
    mock_agent.status = "active"
    mock_agent.mood = "Neutral"
    mock_agent.goals = []
    mock_agent.message_count = 0
    mock_agent.created_at = None
    mock_agent.updated_at = None

    # Mock prefetched relations
    mock_agent.capabilities.related_objects = []
    mock_agent.agent_integrations = []

    mock_repo.get_by_id = AsyncMock(return_value=mock_agent)

    service = AgentService(repo=mock_repo)
    user_id = uuid4()

    agent_data = AgentCreate(
        name="Test Agent",
        personality="Test Personality",
        integrations=["int1", "int2"],
        integration_configs={"int1": {"foo": "bar"}}
    )

    # Mock models and database calls
    with MagicMock() as mock_agent_model, \
         MagicMock() as mock_integration_model, \
         MagicMock() as mock_agent_integration_model, \
         MagicMock() as mock_capability_model:

        # We need to mock the Tortoise Model methods used in the service
        # Agent.create, Capability.filter, Integration.filter, AgentIntegration.create
        with pytest.MonkeyPatch.context() as mp:
            mp.setattr("app.domain.agents.service.Agent.create", AsyncMock(return_value=mock_agent))
            mp.setattr("app.domain.agents.service.Capability.filter", MagicMock(return_value=MagicMock(all=AsyncMock(return_value=[]))))

            # This is the batched query logic we optimized
            mock_int1 = MagicMock(spec=Integration)
            mock_int1.id = "int1"
            mock_int2 = MagicMock(spec=Integration)
            mock_int2.id = "int2"

            mock_filter = MagicMock()
            mock_filter.all = AsyncMock(return_value=[mock_int1, mock_int2])
            mp.setattr("app.domain.agents.service.Integration.filter", MagicMock(return_value=mock_filter))

            mp.setattr("app.domain.agents.service.AgentIntegration.create", AsyncMock())

            # Act
            response = await service.create_agent(agent_data, user_id)

            # Assert
            assert response.name == "Test Agent"
            # Verify integration mapping was used (implicitly if it didn't crash and processed both)
            from app.domain.agents.service import Integration as IntegrationModel
            IntegrationModel.filter.assert_called_once()

            # Verify AgentIntegration.create was called for both integrations
            from app.domain.agents.service import AgentIntegration as AgentIntegrationModel
            assert AgentIntegrationModel.create.call_count == 2
