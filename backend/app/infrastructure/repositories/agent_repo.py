"""Agent repository using Tortoise ORM."""

from __future__ import annotations

import math
from datetime import UTC, datetime
from uuid import UUID

from tortoise.transactions import in_transaction

from app.domain.agents.entities import (
    AgentEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)
from app.domain.agents.interfaces.repository import IAgentRepository
from app.domain.agents.models import (
    Agent,
    AgentIntegration,
    AgentTemplate,
    Capability,
    Integration,
    UserAgentAffinity,
)


def _map_capability(cap: Capability) -> CapabilityEntity:
    return CapabilityEntity(
        id=cap.id,
        name=cap.name,
        description=cap.description,
        icon=cap.icon,
        status=cap.status,
        created_at=cap.created_at,
    )


def _map_integration(integration: Integration) -> IntegrationEntity:
    return IntegrationEntity(
        id=integration.id,
        display_name=integration.display_name,
        description=integration.description,
        icon=integration.icon,
        status=integration.status,
        config_schema=integration.config_schema,
        created_at=integration.created_at,
    )


def _map_template(template: AgentTemplate) -> AgentTemplateEntity:
    return AgentTemplateEntity(
        id=template.id,
        name=template.name,
        description=template.description,
        personality=template.personality,
        goals=template.goals,
        created_at=template.created_at,
    )


def _map_agent(agent: Agent) -> AgentEntity:
    cap_ids = (
        [cap.id for cap in agent.capabilities.related_objects]
        if hasattr(agent.capabilities, "related_objects")
        else []
    )

    integration_ids = []
    integration_configs = {}
    if hasattr(agent, "agent_integrations"):
        for ai in agent.agent_integrations:
            if getattr(ai, "enabled", True):
                integration_ids.append(ai.integration_id)
                if ai.config:
                    integration_configs[ai.integration_id] = ai.config

    return AgentEntity(
        id=agent.id,
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
        capabilities=cap_ids,
        integrations=integration_ids,
        integration_configs=integration_configs,
    )


class AgentRepository(IAgentRepository):
    def __init__(self) -> None:
        # Tortoise ORM models don't need a session passed in
        pass

    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all available capabilities."""
        caps = await Capability.filter(status="active").all()
        return [_map_capability(c) for c in caps]

    async def list_integrations(self) -> list[IntegrationEntity]:
        """List all available integrations."""
        integrations = await Integration.exclude(status="disabled").all()
        return [_map_integration(i) for i in integrations]

    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        """Fetch a single agent by ID, with capabilities prefetched."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )
        if agent:
            return _map_agent(agent)
        return None

    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        """List all agents for a user, excluding soft-deleted ones."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        agents = (
            await Agent.filter(user_id=user_id, deleted_at__isnull=True)
            .prefetch_related("capabilities", "agent_integrations__integration")
            .all()
        )
        return [_map_agent(a) for a in agents]

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        """List agent templates (paginated)."""
        templates = await AgentTemplate.all().offset(skip).limit(limit)
        return [_map_template(t) for t in templates]

    async def create_agent(
        self,
        user_id: UUID,
        agent_data: dict,
        system_prompt: str,
        capabilities: list[str] | None,
        integrations: list[str] | None,
        integration_configs: dict | None,
    ) -> AgentEntity:
        """Create a new agent."""
        async with in_transaction():
            agent = await Agent.create(
                user_id=user_id,
                name=agent_data.get("name"),
                personality=agent_data.get("personality"),
                description=agent_data.get("description"),
                goals=agent_data.get("goals", []),
                system_prompt=system_prompt,
            )

            if capabilities:
                caps = await Capability.filter(id__in=capabilities)
                await agent.capabilities.add(*caps)

            if integrations:
                integration_configs = integration_configs or {}
                ints = await Integration.filter(id__in=integrations)
                agent_integrations = [
                    AgentIntegration(
                        agent=agent,
                        integration=integration,
                        config=integration_configs.get(str(integration.id), {}),
                        enabled=True,
                    )
                    for integration in ints
                ]
                if agent_integrations:
                    await AgentIntegration.bulk_create(agent_integrations)

            refetched = await Agent.get(id=agent.id).prefetch_related(
                "capabilities", "agent_integrations__integration"
            )
            return _map_agent(refetched)

    async def update_agent(
        self,
        agent_id: UUID | str,
        user_id: UUID | str,
        agent_data: dict,
        system_prompt: str | None,
        capabilities: list[str] | None,
        integrations: list[str] | None,
        integration_configs: dict | None,
    ) -> AgentEntity | None:
        """Update an agent's fields. Only updates the owner's agent."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        async with in_transaction():
            agent = await Agent.get_or_none(id=agent_id, user_id=user_id).prefetch_related(
                "capabilities", "agent_integrations__integration"
            )
            if not agent:
                return None

            for key, value in agent_data.items():
                if value is not None:
                    setattr(agent, key, value)

            if system_prompt is not None:
                agent.system_prompt = system_prompt

            await agent.save()

            if capabilities is not None:
                caps = await Capability.filter(id__in=capabilities)
                await agent.capabilities.clear()
                if caps:
                    await agent.capabilities.add(*caps)

            if integrations is not None:
                await AgentIntegration.filter(agent=agent).delete()
                integration_configs = integration_configs or {}
                ints = await Integration.filter(id__in=integrations)
                agent_integrations = [
                    AgentIntegration(
                        agent=agent,
                        integration=integration,
                        config=integration_configs.get(str(integration.id), {}),
                        enabled=True,
                    )
                    for integration in ints
                ]
                if agent_integrations:
                    await AgentIntegration.bulk_create(agent_integrations)

            refetched = await Agent.get(id=agent.id).prefetch_related(
                "capabilities", "agent_integrations__integration"
            )
            return _map_agent(refetched)

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id)
        if agent:
            agent.mood = mood
            await agent.save()

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
