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
    AgentTemplate,
    AgentTemplateResponse,
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

    async def list_capabilities(self) -> list[Capability]:
        """List all capabilities from the database."""
        return await self.repo.list_capabilities()

    async def list_integrations(self) -> list[Integration]:
        """List all integrations from the database."""
        return await self.repo.list_integrations()

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
            for integration_id in agent_data.integrations:
                integration = await Integration.get_or_none(id=integration_id)
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
        """Analyze recent conversation history and update agent mood via LLM."""
        if not recent_history.strip():
            return
        from app.infrastructure.external.openrouter import chat_completion
        try:
            mood = await chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an emotional analyst. Respond with a single word describing "
                            "the dominant mood of the following conversation (e.g. Curious, Happy, "
                            "Frustrated, Excited, Thoughtful, Neutral, Optimistic, Anxious)."
                        ),
                    },
                    {"role": "user", "content": recent_history[-2000:]},  # limit tokens
                ]
            )
            mood = mood.strip().split()[0][:50]  # first word, max 50 chars
        except Exception as exc:
            logger.warning("Mood update failed, defaulting to Neutral: %s", exc)
            mood = "Neutral"
        await self.repo.update_mood(agent_id, mood)

    async def list_templates(self) -> list[AgentTemplateResponse]:
        """List all available agent templates."""
        templates = await self.repo.list_templates()
        return [
            AgentTemplateResponse(
                id=t.pk,
                name=t.name,
                description=t.description,
                personality=t.personality,
                goals=t.goals or [],
                created_at=t.created_at,
            )
            for t in templates
        ]

    async def create_from_template(
        self,
        template_id: UUID,
        user_id: UUID,
        name_override: str | None = None,
    ) -> AgentResponse:
        """Create a new agent from an existing template."""
        template = await self.repo.get_template_by_id(template_id)
        if not template:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Agent template not found")

        agent_data = AgentCreate(
            name=name_override or template.name,
            personality=template.personality,
            description=template.description,
            goals=template.goals or [],
            capabilities=[cap.pk for cap in template.capabilities.related_objects],
        )
        return await self.create_agent(agent_data, user_id)
