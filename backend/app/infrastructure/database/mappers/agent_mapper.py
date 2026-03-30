"""Mappers to convert Tortoise ORM models to Domain Entities for Agents."""

from app.domain.agents.entities import (
    AgentEntity,
    AgentIntegrationEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)
from app.infrastructure.database.models.agents_models import (
    Agent,
    AgentIntegration,
    AgentTemplate,
    Capability,
    Integration,
)


class AgentMapper:
    """Mapper for Agent bounded context."""

    @staticmethod
    def to_capability_entity(model: Capability) -> CapabilityEntity:
        return CapabilityEntity(
            id=model.pk,
            name=model.name,
            description=model.description,
            icon=model.icon,
            status=model.status,
            created_at=model.created_at,
        )

    @staticmethod
    def to_integration_entity(model: Integration) -> IntegrationEntity:
        return IntegrationEntity(
            id=model.pk,
            display_name=model.display_name,
            description=model.description,
            icon=model.icon,
            status=model.status,
            config_schema=model.config_schema,
            created_at=model.created_at,
        )

    @staticmethod
    def to_agent_integration_entity(model: AgentIntegration) -> AgentIntegrationEntity:
        return AgentIntegrationEntity(
            id=model.pk,
            agent_id=model.agent_id,
            integration_id=model.integration_id,
            enabled=model.enabled,
            config=model.config,
            credentials=model.credentials,
            connected_at=model.connected_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_agent_entity(model: Agent) -> AgentEntity:
        # Assumes related objects are fetched if needed
        capabilities = []
        if hasattr(model, "capabilities") and hasattr(model.capabilities, "related_objects"):
            capabilities = [
                AgentMapper.to_capability_entity(cap) for cap in model.capabilities.related_objects
            ]

        agent_integrations = []
        if hasattr(model, "agent_integrations") and hasattr(
            model.agent_integrations, "related_objects"
        ):
            agent_integrations = [
                AgentMapper.to_agent_integration_entity(ai)
                for ai in model.agent_integrations.related_objects
            ]

        return AgentEntity(
            id=model.pk,
            user_id=model.user_id,
            name=model.name,
            personality=model.personality,
            description=model.description,
            system_prompt=model.system_prompt,
            status=model.status,
            mood=model.mood,
            goals=model.goals or [],
            message_count=model.message_count,
            created_at=model.created_at,
            updated_at=model.updated_at,
            deleted_at=model.deleted_at,
            capabilities=capabilities,
            agent_integrations=agent_integrations,
        )

    @staticmethod
    def to_template_entity(model: AgentTemplate) -> AgentTemplateEntity:
        capabilities = []
        if hasattr(model, "capabilities") and hasattr(model.capabilities, "related_objects"):
            capabilities = [
                AgentMapper.to_capability_entity(cap) for cap in model.capabilities.related_objects
            ]

        return AgentTemplateEntity(
            id=model.pk,
            name=model.name,
            description=model.description,
            personality=model.personality,
            goals=model.goals or [],
            created_at=model.created_at,
            capabilities=capabilities,
        )
