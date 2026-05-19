"""Agent repository using Tortoise ORM."""

from __future__ import annotations

import math
from datetime import UTC, datetime
from uuid import UUID

from tortoise.transactions import in_transaction

from app.domain.agents.models import (
    Agent,
    AgentIntegration,
    AgentTemplate,
    Capability,
    Integration,
    UserAgentAffinity,
)


class AgentRepository:
    def __init__(self) -> None:
        # Tortoise ORM models don't need a session passed in
        pass

    async def list_capabilities(self) -> list[Capability]:
        """List all available capabilities."""
        return await Capability.filter(status="active").all()

    async def list_integrations(self) -> list[Integration]:
        """List all available integrations."""
        return await Integration.exclude(status="disabled").all()

    async def get_by_id(self, agent_id: UUID | str) -> Agent | None:
        """Fetch a single agent by ID, with capabilities prefetched."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        return await Agent.get_or_none(id=agent_id).prefetch_related(
            "capabilities", "agent_integrations__integration"
        )

    async def list_by_user(self, user_id: UUID | str) -> list[Agent]:
        """List all agents for a user, excluding soft-deleted ones."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        return (
            await Agent.filter(user_id=user_id, deleted_at__isnull=True)
            .prefetch_related("capabilities", "agent_integrations__integration")
            .all()
        )

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplate]:
        """List agent templates (paginated)."""
        return await AgentTemplate.all().offset(skip).limit(limit)

    async def create(self, agent: Agent) -> Agent:
        """Create a new agent."""
        await agent.save()
        return agent

    async def create_agent_with_relations(
        self,
        user_id: UUID | str,
        name: str,
        personality: str,
        system_prompt: str,
        description: str | None = None,
        goals: list[str] | None = None,
        capability_ids: list[str] | None = None,
        integration_ids: list[str] | None = None,
        integration_configs: dict | None = None,
    ) -> Agent:
        """Create an agent along with its capabilities and integrations."""
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
            integrations = await Integration.filter(id__in=integration_ids)
            configs = integration_configs or {}
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

        refetched = await self.get_by_id(agent.pk)
        return refetched if refetched is not None else agent

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        agent = await self.get_by_id(agent_id)
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
        capabilities: list[str] | None = None,
        integrations: list[str] | None = None,
        integration_configs: dict | None = None,
        **fields: object,
    ) -> tuple[Agent | None, list[str]]:
        """Update an agent's fields and relations.

        Only updates the owner's agent. Handles replacing capability
        and integration many-to-many relationships safely.

        Args:
            agent_id: The ID of the agent to update.
            user_id: The ID of the user that owns the agent.
            capabilities: The list of capability IDs to replace existing ones.
            integrations: The list of integration IDs to replace existing ones.
            integration_configs: Configuration dicts mapped by integration ID.
            **fields: Arbitrary model fields allowed for updating.

        Returns:
            tuple[Agent | None, list[str]]: A tuple containing the updated Agent
                instance (or None if not found), and the list of effective capability IDs.
        """
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

        if not agent:
            return None, []

        async with in_transaction():
            if capabilities is not None:
                caps = await Capability.filter(id__in=capabilities)
                await agent.capabilities.clear()
                if caps:
                    await agent.capabilities.add(*caps)
                effective_cap_ids = [str(c.id) for c in caps]
            else:
                effective_cap_ids = [
                    str(c_id)
                    for c_id in await agent.capabilities.all().values_list("id", flat=True)
                ]

            if integrations is not None:
                await AgentIntegration.filter(agent=agent).delete()
                integration_records = await Integration.filter(id__in=integrations)
                configs = integration_configs or {}
                agent_integrations = [
                    AgentIntegration(
                        agent=agent,
                        integration=integration,
                        config=configs.get(str(integration.id), {}),
                        enabled=True,
                    )
                    for integration in integration_records
                ]
                if agent_integrations:
                    await AgentIntegration.bulk_create(agent_integrations)

            for key, value in fields.items():
                if value is not None:
                    setattr(agent, key, value)

            await agent.save()

        refetched_agent = await self.get_by_id(agent_id)
        return refetched_agent, effective_cap_ids

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
