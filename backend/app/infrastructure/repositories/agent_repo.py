"""Agent repository using Tortoise ORM."""

from __future__ import annotations

import math
from datetime import UTC, datetime
from uuid import UUID

from tortoise.transactions import in_transaction

from app.application.interfaces.agent_repository import AgentRepositoryInterface
from app.domain.agents.entities import (
    AgentEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)
from app.infrastructure.database.mappers.agent_mapper import AgentMapper
from app.infrastructure.database.models.agents_models import (
    Agent,
    AgentIntegration,
    AgentTemplate,
    Capability,
    Integration,
    UserAgentAffinity,
)


class AgentRepository(AgentRepositoryInterface):
    def __init__(self) -> None:
        # Tortoise ORM models don't need a session passed in
        pass

    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all available capabilities."""
        models = await Capability.filter(status="active").all()
        return [AgentMapper.to_capability_entity(m) for m in models]

    async def list_integrations(self) -> list[IntegrationEntity]:
        """List all available integrations."""
        models = await Integration.exclude(status="disabled").all()
        return [AgentMapper.to_integration_entity(m) for m in models]

    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        """Fetch a single agent by ID, with capabilities prefetched."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        model = await Agent.get_or_none(id=agent_id).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )
        return AgentMapper.to_agent_entity(model) if model else None

    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        """List all agents for a user, excluding soft-deleted ones."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        models = (
            await Agent.filter(user_id=user_id, deleted_at__isnull=True)
            .prefetch_related("capabilities", "agent_integrations__integration")
            .all()
        )
        return [AgentMapper.to_agent_entity(m) for m in models]

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        """List agent templates (paginated)."""
        models = await AgentTemplate.all().offset(skip).limit(limit)
        return [AgentMapper.to_template_entity(m) for m in models]

    async def create_agent(
        self,
        user_id: UUID | str,
        name: str,
        personality: str,
        description: str | None,
        goals: list[str] | None,
        system_prompt: str | None,
    ) -> AgentEntity:
        """Create a new agent."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        agent = await Agent.create(
            user_id=user_id,
            name=name,
            personality=personality,
            description=description,
            goals=goals or [],
            system_prompt=system_prompt,
        )
        # Refetch to ensure all relations are available even if empty
        refetched = await Agent.get(id=agent.pk).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )
        return AgentMapper.to_agent_entity(refetched)

    async def set_capabilities(self, agent_id: UUID | str, capability_ids: list[str]) -> None:
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id)
        if agent:
            caps = await Capability.filter(id__in=capability_ids)
            await agent.capabilities.clear()
            if caps:
                await agent.capabilities.add(*caps)

    async def get_capability_ids(self, agent_id: UUID | str) -> list[str]:
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id)
        if not agent:
            return []
        return [str(c_id) for c_id in await agent.capabilities.all().values_list("id", flat=True)]

    async def set_integrations(
        self,
        agent_id: UUID | str,
        integration_ids: list[str],
        integration_configs: dict,
    ) -> None:
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        agent = await Agent.get_or_none(id=agent_id)
        if not agent:
            return
        await AgentIntegration.filter(agent=agent).delete()
        if integration_ids:
            integrations = await Integration.filter(id__in=integration_ids)
            agent_integrations = [
                AgentIntegration(
                    agent=agent,
                    integration=integration,
                    config=integration_configs.get(str(integration.id), {}),
                    enabled=True,
                )
                for integration in integrations
            ]
            if agent_integrations:
                await AgentIntegration.bulk_create(agent_integrations)

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
        self, agent_id: UUID | str, user_id: UUID | str, **fields: object
    ) -> AgentEntity | None:
        """Update an agent's fields. Only updates the owner's agent."""
        unknown = set(fields) - self._ALLOWED_AGENT_FIELDS
        if unknown:
            raise ValueError(f"update_agent received unknown fields: {unknown}")
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        agent = await Agent.get_or_none(id=agent_id, user_id=user_id).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )
        if agent:
            for key, value in fields.items():
                if value is not None:
                    setattr(agent, key, value)
            await agent.save()
            return AgentMapper.to_agent_entity(agent)
        return None

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
