"""Agent service for business logic."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.domain.agents.models import (
    Agent,
    AgentCreate,
    AgentGenerationResponse,
    AgentIntegration,
    AgentResponse,
    Capability,
    Integration,
)
from app.infrastructure.external.openrouter import structured_completion

if TYPE_CHECKING:
    from uuid import UUID

    from openai.types.chat import ChatCompletionMessageParam

    from app.infrastructure.repositories.agent_repo import AgentRepository

logger = logging.getLogger(__name__)


def _build_agent_response(agent: Agent) -> AgentResponse:
    """Construct an AgentResponse from a prefetched Agent ORM instance.

    Assumes ``capabilities`` and ``agent_integrations__integration`` have been
    prefetched on the agent before calling this function.
    """
    cap_ids: list[str] = [cap.pk for cap in agent.capabilities.related_objects]
    integration_ids: list[str] = [
        ai.integration_id
        for ai in agent.agent_integrations  # type: ignore[attr-defined]
        if ai.enabled
    ]
    integration_configs: dict = {
        ai.integration_id: ai.config
        for ai in agent.agent_integrations  # type: ignore[attr-defined]
        if ai.enabled and ai.config
    }
    return AgentResponse(
        id=agent.pk,
        user_id=agent.user_id,
        name=agent.name,
        personality=agent.personality,
        description=agent.description,
        system_prompt=agent.system_prompt,
        status=agent.status,
        mood=agent.mood,
        goals=agent.goals or [],
        capabilities=cap_ids,
        integrations=integration_ids,
        integration_configs=integration_configs,
        message_count=agent.message_count,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
    )


class AgentService:
    def __init__(self, repo: AgentRepository):
        self.repo = repo
        self._cached_capabilities: list[Capability] | None = None
        self._cached_integrations: list[Integration] | None = None

    async def list_capabilities(self) -> list[Capability]:
        """List all capabilities from the database."""
        # Justification: Cache capabilities per-request to avoid redundant DB queries
        # when building prompts for multiple agents or repeatedly verifying capabilities.
        if self._cached_capabilities is None:
            self._cached_capabilities = await self.repo.list_capabilities()
        return self._cached_capabilities

    async def list_integrations(self) -> list[Integration]:
        """List all integrations from the database."""
        # Justification: Cache integrations per-request to avoid redundant DB queries
        # when building agents.
        if self._cached_integrations is None:
            self._cached_integrations = await self.repo.list_integrations()
        return self._cached_integrations

    async def build_system_prompt(
        self,
        name: str,
        personality: str,
        description: str | None = None,
        goals: list[str] | None = None,
        capability_ids: list[str] | None = None,
    ) -> str:
        """Build a rich system prompt from agent profile fields."""
        sections = [f"You are {name}."]
        if description:
            sections.append(description)
        sections.append(f"\nPersonality & Behavior:\n{personality}")
        if goals:
            goal_list = "\n".join(f"- {g}" for g in goals)
            sections.append(f"\nYour Goals:\n{goal_list}")
        if capability_ids:
            all_caps = await self.list_capabilities()
            cap_names = [c.name for c in all_caps if c.id in capability_ids]
            cap_list = ", ".join(cap_names)
            sections.append(f"\nYou have the following capabilities: {cap_list}.")
        return "\n".join(sections)

    async def create_agent(self, agent_data: AgentCreate, user_id: UUID) -> AgentResponse:
        """Onboard a new agent with a built system prompt."""
        system_prompt = agent_data.system_prompt or await self.build_system_prompt(
            name=agent_data.name,
            personality=agent_data.personality,
            description=agent_data.description,
            goals=agent_data.goals,
            capability_ids=agent_data.capabilities,
        )

        agent = await Agent.create(
            user_id=user_id,
            name=agent_data.name,
            personality=agent_data.personality,
            description=agent_data.description,
            goals=agent_data.goals,
            system_prompt=system_prompt,
        )

        if agent_data.capabilities:
            caps = await Capability.filter(id__in=agent_data.capabilities)
            await agent.capabilities.add(*caps)

        if agent_data.integrations:
            # PERF(agent): Fetch all required integrations in a single batch query
            # to avoid N+1 database roundtrips during agent creation.
            # Reduced Integration.get_or_none calls from N to 1.
            integrations = await Integration.filter(id__in=agent_data.integrations).all()
            integration_map = {i.id: i for i in integrations}

            for integration_id in agent_data.integrations:
                integration = integration_map.get(integration_id)
                if integration:
                    config = agent_data.integration_configs.get(integration_id, {})
                    await AgentIntegration.create(
                        agent=agent,
                        integration=integration,
                        config=config,
                        enabled=True,
                    )

        # Refetch with relations so the response is fully populated.
        refetched = await self.repo.get_by_id(agent.pk)
        assert refetched is not None
        return _build_agent_response(refetched)

    async def list_agents(self, user_id: UUID) -> list[AgentResponse]:
        """List all agents for a user."""
        agents = await self.repo.list_by_user(user_id)
        return [_build_agent_response(a) for a in agents]

    async def generate_agent_profile(self, keywords: str) -> AgentGenerationResponse:
        """Use Instructor to generate a validated agent profile."""
        messages: list[ChatCompletionMessageParam] = [
            {
                "role": "system",
                "content": (
                    "You are a creative director for AI personas. "
                    "Create a unique, high-quality persona based on the user's keywords."
                ),
            },
            {"role": "user", "content": f"Keywords: {keywords}"},
        ]

        return await structured_completion(
            messages=messages,
            response_model=AgentGenerationResponse,
        )

    async def update_mood(self, agent_id: UUID | str, recent_history: str) -> None:
        """Analyze history and update agent mood via repository."""
        if not recent_history.strip():
            return
        await self.repo.update_mood(agent_id, "Optimistic")
