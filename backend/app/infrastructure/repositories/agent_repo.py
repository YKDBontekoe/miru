"""Agent repository using Tortoise ORM."""

from __future__ import annotations

import math
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from tortoise.transactions import in_transaction

from app.domain.agents.entities import (
    AgentEntity,
    AgentIntegrationEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
    UserAgentAffinityEntity,
)
from app.domain.agents.models import (
    Agent,
    AgentIntegration,
    AgentTemplate,
    Capability,
    Integration,
    UserAgentAffinity,
)


def _map_capability_to_entity(capability: Capability) -> CapabilityEntity:
    return CapabilityEntity(
        id=capability.id,
        name=capability.name,
        description=capability.description,
        icon=capability.icon,
        status=capability.status,
        created_at=capability.created_at,
    )


def _map_integration_to_entity(integration: Integration) -> IntegrationEntity:
    return IntegrationEntity(
        id=integration.id,
        display_name=integration.display_name,
        description=integration.description,
        icon=integration.icon,
        status=integration.status,
        config_schema=integration.config_schema,
        created_at=integration.created_at,
    )


def _map_agent_integration_to_entity(ai: AgentIntegration) -> AgentIntegrationEntity:
    return AgentIntegrationEntity(
        id=ai.id,
        agent_id=ai.agent_id if hasattr(ai, "agent_id") else ai.agent.id,
        integration_id=ai.integration_id,
        enabled=ai.enabled,
        config=ai.config,
        credentials=ai.credentials,
        connected_at=ai.connected_at,
        created_at=ai.created_at,
        updated_at=ai.updated_at,
    )


def _map_agent_to_entity(agent: Agent) -> AgentEntity:
    capabilities = []
    if hasattr(agent, "capabilities"):
        capabilities = [
            _map_capability_to_entity(cap) for cap in agent.capabilities.related_objects
        ]

    agent_integrations = []
    if hasattr(agent, "agent_integrations"):
        agent_integrations = [
            _map_agent_integration_to_entity(ai) for ai in agent.agent_integrations if ai.enabled
        ]

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
        personality_history=agent.personality_history or [],
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        deleted_at=agent.deleted_at,
        capabilities=capabilities,
        agent_integrations=agent_integrations,
    )


def _map_agent_template_to_entity(template: AgentTemplate) -> AgentTemplateEntity:
    capabilities = []
    if hasattr(template, "capabilities") and hasattr(template.capabilities, "related_objects"):
        capabilities = [
            _map_capability_to_entity(cap) for cap in template.capabilities.related_objects
        ]
    return AgentTemplateEntity(
        id=template.id,
        name=template.name,
        description=template.description,
        personality=template.personality,
        goals=template.goals or [],
        created_at=template.created_at,
        capabilities=capabilities,
    )


class AgentRepository:
    def __init__(self) -> None:
        # Tortoise ORM models don't need a session passed in
        pass

    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all available capabilities."""
        caps = await Capability.filter(status="active").all()
        return [_map_capability_to_entity(c) for c in caps]

    async def list_integrations(self) -> list[IntegrationEntity]:
        """List all available integrations."""
        integrations = await Integration.exclude(status="disabled").all()
        return [_map_integration_to_entity(i) for i in integrations]

    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        """Fetch a single agent by ID, with capabilities prefetched."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )
        return _map_agent_to_entity(agent) if agent else None

    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        """List all agents for a user, excluding soft-deleted ones."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        agents = (
            await Agent.filter(user_id=user_id, deleted_at__isnull=True)
            .prefetch_related("capabilities", "agent_integrations__integration")
            .all()
        )
        return [_map_agent_to_entity(a) for a in agents]

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        """List agent templates (paginated)."""
        templates = (
            await AgentTemplate.all().prefetch_related("capabilities").offset(skip).limit(limit)
        )
        return [_map_agent_template_to_entity(t) for t in templates]

    async def create_agent(
        self,
        user_id: UUID,
        name: str,
        personality: str,
        system_prompt: str,
        description: str | None = None,
        goals: list[str] | None = None,
        capability_ids: list[str] | None = None,
        integration_ids: list[str] | None = None,
        integration_configs: dict[str, Any] | None = None,
    ) -> AgentEntity:
        """Create a new agent and its relations."""
        async with in_transaction():
            agent = await Agent.create(
                user_id=user_id,
                name=name,
                personality=personality,
                description=description,
                goals=goals or [],
                system_prompt=system_prompt,
            )

            if capability_ids:
                caps = await Capability.filter(id__in=capability_ids)
                await agent.capabilities.add(*caps)

            if integration_ids:
                configs = integration_configs or {}
                for int_id in integration_ids:
                    integration = await Integration.get_or_none(id=int_id)
                    if integration:
                        await AgentIntegration.create(
                            agent=agent,
                            integration=integration,
                            config=configs.get(int_id, {}),
                            enabled=True,
                        )

            # Refetch fully populated
            return await self.get_by_id(agent.id)

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        agent = await self.get_by_id(agent_id)
        if agent:
            agent.mood = mood
            await agent.save()

    _ALLOWED_AGENT_FIELDS: frozenset[str] = frozenset(
        {
            "name",
            "personality",
            "description",
            "goals",
            "system_prompt",
            "mood",
            "personality_history",
        }
    )

    async def update_agent(
        self,
        agent_id: UUID | str,
        user_id: UUID | str,
        capability_ids: list[str] | None = None,
        integration_ids: list[str] | None = None,
        integration_configs: dict[str, Any] | None = None,
        **fields: object,
    ) -> AgentEntity | None:
        """Update an agent's fields. Only updates the owner's agent."""
        unknown = set(fields) - self._ALLOWED_AGENT_FIELDS
        if unknown:
            raise ValueError(f"update_agent received unknown fields: {unknown}")
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        async with in_transaction():
            agent = await Agent.get_or_none(id=agent_id, user_id=user_id)
            if not agent:
                return None

            for key, value in fields.items():
                if value is not None:
                    setattr(agent, key, value)
            await agent.save()

            if capability_ids is not None:
                caps = await Capability.filter(id__in=capability_ids)
                await agent.capabilities.clear()
                if caps:
                    await agent.capabilities.add(*caps)

            if integration_ids is not None:
                await AgentIntegration.filter(agent=agent).delete()
                configs = integration_configs or {}
                integrations = await Integration.filter(id__in=integration_ids)
                agent_integrations = [
                    AgentIntegration(
                        agent=agent,
                        integration=integration,
                        config=configs.get(str(integration.id), {}),
                        enabled=True,
                    )
                    for integration in integrations
                ]
                if agent_integrations:
                    await AgentIntegration.bulk_create(agent_integrations)

            return await self.get_by_id(agent.id)

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

    async def get_affinity(self, user_id: UUID, agent_id: UUID) -> UserAgentAffinityEntity | None:
        """Fetch the affinity record for a user-agent pair, or None if not yet established."""
        affinity = await UserAgentAffinity.get_or_none(user_id=user_id, agent_id=agent_id)
        if affinity:
            return UserAgentAffinityEntity(
                user_id=affinity.user_id,
                agent_id=affinity.agent_id,
                affinity_score=affinity.affinity_score,
                trust_level=affinity.trust_level,
                milestones=affinity.milestones or [],
                last_interaction_at=affinity.last_interaction_at,
                created_at=affinity.created_at,
            )
        return None

    async def increment_message_count(self, agent_id: UUID | str) -> None:
        """Increment an agent's message count."""
        agent = await self.get_by_id(agent_id)
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
        """Increment affinity score, unlock milestones, and update trust level.

        The entire read-modify-write is wrapped in a transaction with a row-level
        lock (``select_for_update``) to prevent concurrent increments from racing.
        """
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
