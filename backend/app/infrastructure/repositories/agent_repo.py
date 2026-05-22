"""Agent repository using Tortoise ORM."""

from __future__ import annotations

import math
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from tortoise.transactions import in_transaction

from app.domain.agents.entities import (
    AgentEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)
from app.domain.agents.repository import AgentRepositoryInterface
from app.infrastructure.database.models.agent_models import (
    Agent,
    AgentIntegration,
    AgentTemplate,
    Capability,
    Integration,
    UserAgentAffinity,
)


def _map_agent_to_entity(agent: Agent) -> AgentEntity:
    """Map Tortoise Agent model to AgentEntity."""
    return AgentEntity(
        id=agent.pk,
        user_id=agent.user_id,
        name=agent.name,
        personality=agent.personality,
        description=agent.description,
        system_prompt=agent.system_prompt,
        status=agent.status,
        mood=agent.mood,
        goals=agent.goals or [],
        message_count=agent.message_count,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        deleted_at=agent.deleted_at,
    )


def _map_capability_to_entity(capability: Capability) -> CapabilityEntity:
    """Map Tortoise Capability model to CapabilityEntity."""
    return CapabilityEntity(
        id=capability.pk,
        name=capability.name,
        description=capability.description,
        icon=capability.icon,
        status=capability.status,
        created_at=capability.created_at,
    )


def _map_integration_to_entity(integration: Integration) -> IntegrationEntity:
    """Map Tortoise Integration model to IntegrationEntity."""
    return IntegrationEntity(
        id=integration.pk,
        display_name=integration.display_name,
        description=integration.description,
        icon=integration.icon,
        status=integration.status,
        config_schema=integration.config_schema or [],
        created_at=integration.created_at,
    )


def _map_template_to_entity(template: AgentTemplate) -> AgentTemplateEntity:
    """Map Tortoise AgentTemplate model to AgentTemplateEntity."""
    return AgentTemplateEntity(
        id=template.pk,
        name=template.name,
        description=template.description,
        personality=template.personality,
        goals=template.goals or [],
        created_at=template.created_at,
    )


class AgentRepository(AgentRepositoryInterface):
    def __init__(self) -> None:
        pass

    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all available capabilities."""
        models = await Capability.filter(status="active").all()
        return [_map_capability_to_entity(m) for m in models]

    async def list_integrations(self) -> list[IntegrationEntity]:
        """List all available integrations."""
        models = await Integration.exclude(status="disabled").all()
        return [_map_integration_to_entity(m) for m in models]

    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        """Fetch a single agent by ID."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )
        if not agent:
            return None

        entity = _map_agent_to_entity(agent)
        if hasattr(agent, "capabilities"):
            entity.capability_ids = [cap.pk for cap in agent.capabilities]
        if hasattr(agent, "agent_integrations"):
            entity.integration_ids = [
                ai.integration_id for ai in agent.agent_integrations if ai.enabled
            ]
            entity.integration_configs = {
                ai.integration_id: ai.config
                for ai in agent.agent_integrations
                if ai.enabled and ai.config
            }
        return entity

    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        """List all agents for a user, excluding soft-deleted ones."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        agents = (
            await Agent.filter(user_id=user_id, deleted_at__isnull=True)
            .prefetch_related("capabilities", "agent_integrations__integration")
            .all()
        )

        entities = []
        for agent in agents:
            entity = _map_agent_to_entity(agent)
            if hasattr(agent, "capabilities"):
                entity.capability_ids = [cap.pk for cap in agent.capabilities]
            if hasattr(agent, "agent_integrations"):
                entity.integration_ids = [
                    ai.integration_id for ai in agent.agent_integrations if ai.enabled
                ]
                entity.integration_configs = {
                    ai.integration_id: ai.config
                    for ai in agent.agent_integrations
                    if ai.enabled and ai.config
                }
            entities.append(entity)
        return entities

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        """List agent templates (paginated)."""
        templates = await AgentTemplate.all().offset(skip).limit(limit)
        return [_map_template_to_entity(t) for t in templates]

    async def create_agent(
        self,
        user_id: UUID,
        name: str,
        personality: str,
        description: str | None,
        goals: list[str],
        system_prompt: str | None,
        capability_ids: list[str] | None = None,
        integrations_data: list[dict[str, Any]] | None = None,
    ) -> AgentEntity:
        """Create a new agent along with capabilities and integrations."""
        agent = await Agent.create(
            user_id=user_id,
            name=name,
            personality=personality,
            description=description,
            goals=goals,
            system_prompt=system_prompt,
        )

        if capability_ids:
            caps = await Capability.filter(id__in=capability_ids)
            await agent.capabilities.add(*caps)

        if integrations_data:
            integration_ids = [data["id"] for data in integrations_data]
            integrations = await Integration.filter(id__in=integration_ids)
            integration_map = {str(i.id): i for i in integrations}

            agent_integrations = []
            for data in integrations_data:
                integration = integration_map.get(str(data["id"]))
                if integration:
                    agent_integrations.append(
                        AgentIntegration(
                            agent=agent,
                            integration=integration,
                            config=data.get("config", {}),
                            enabled=True,
                        )
                    )
            if agent_integrations:
                await AgentIntegration.bulk_create(agent_integrations)

        # Refetch to get correct relations
        refetched = await Agent.get(id=agent.pk).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )

        entity = _map_agent_to_entity(refetched)
        if hasattr(refetched, "capabilities"):
            entity.capability_ids = [cap.pk for cap in refetched.capabilities]
        if hasattr(refetched, "agent_integrations"):
            entity.integration_ids = [
                ai.integration_id for ai in refetched.agent_integrations if ai.enabled
            ]
            entity.integration_configs = {
                ai.integration_id: ai.config
                for ai in refetched.agent_integrations
                if ai.enabled and ai.config
            }
        return entity

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id)
        if agent:
            agent.mood = mood
            await agent.save()

    _ALLOWED_AGENT_FIELDS: frozenset[str] = frozenset(
        {"name", "personality", "description", "goals", "system_prompt", "mood"}
    )

    async def update_agent(
        self,
        agent_id: UUID | str,
        user_id: UUID | str,
        fields: dict[str, Any],
        new_capability_ids: list[str] | None = None,
        new_integrations_data: list[dict[str, Any]] | None = None,
    ) -> AgentEntity | None:
        """Update an agent's fields and M2M relationships."""
        unknown = set(fields) - self._ALLOWED_AGENT_FIELDS
        if unknown:
            raise ValueError(f"update_agent received unknown fields: {unknown}")
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        agent = await Agent.get_or_none(id=agent_id, user_id=user_id)
        if not agent:
            return None

        # Update base fields
        for key, value in fields.items():
            if value is not None:
                setattr(agent, key, value)
        await agent.save()

        # Update capabilities
        if new_capability_ids is not None:
            caps = await Capability.filter(id__in=new_capability_ids)
            await agent.capabilities.clear()
            if caps:
                await agent.capabilities.add(*caps)

        # Update integrations
        if new_integrations_data is not None:
            await AgentIntegration.filter(agent=agent).delete()
            integration_ids = [data["id"] for data in new_integrations_data]
            integrations = await Integration.filter(id__in=integration_ids)
            integration_map = {str(i.id): i for i in integrations}

            agent_integrations = []
            for data in new_integrations_data:
                integration = integration_map.get(str(data["id"]))
                if integration:
                    agent_integrations.append(
                        AgentIntegration(
                            agent=agent,
                            integration=integration,
                            config=data.get("config", {}),
                            enabled=True,
                        )
                    )
            if agent_integrations:
                await AgentIntegration.bulk_create(agent_integrations)

        # Refetch to get correct relations
        refetched = await Agent.get(id=agent.pk).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )

        entity = _map_agent_to_entity(refetched)
        if hasattr(refetched, "capabilities"):
            entity.capability_ids = [cap.pk for cap in refetched.capabilities]
        if hasattr(refetched, "agent_integrations"):
            entity.integration_ids = [
                ai.integration_id for ai in refetched.agent_integrations if ai.enabled
            ]
            entity.integration_configs = {
                ai.integration_id: ai.config
                for ai in refetched.agent_integrations
                if ai.enabled and ai.config
            }
        return entity

    async def delete_agent(self, agent_id: UUID | str, user_id: UUID | str) -> bool:
        """Soft-delete an agent by setting deleted_at. Only deletes the owner's agent."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        agent = await Agent.get_or_none(id=agent_id, user_id=user_id, deleted_at__isnull=True)
        if agent:
            agent.deleted_at = datetime.now(UTC)
            await agent.save()
            return True
        return False

    async def increment_message_count(self, agent_id: UUID | str) -> None:
        """Increment an agent's message count."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id)
        if agent:
            agent.message_count += 1
            await agent.save()

    _AFFINITY_MILESTONES = (
        (10, "first_chat"),
        (50, "regular"),
        (100, "trusted"),
        (500, "companion"),
    )

    async def upsert_affinity(
        self, user_id: UUID, agent_id: UUID, score_delta: float = 1.0
    ) -> None:
        """Increment affinity score, unlock milestones, and update trust level."""
        async with in_transaction():
            affinity = await UserAgentAffinity.select_for_update().get_or_none(
                user_id=user_id, agent_id=agent_id
            )
            if affinity is None:
                affinity = UserAgentAffinity(
                    user_id=user_id,
                    agent_id=agent_id,
                    affinity_score=0.0,
                    trust_level=1,
                    milestones=[],
                )
            affinity.affinity_score = (affinity.affinity_score or 0.0) + score_delta

            milestones: list = list(affinity.milestones or [])
            for threshold, name in self._AFFINITY_MILESTONES:
                if affinity.affinity_score >= threshold and name not in milestones:
                    milestones.append(name)
            affinity.milestones = milestones

            # Trust level grows logarithmically: 1–6 range across 1–500k score
            affinity.trust_level = max(1, int(math.log10(max(1.0, affinity.affinity_score)) + 1))
            await affinity.save()
