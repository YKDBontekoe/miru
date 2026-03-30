"""Agent application use cases orchestrating domain entities and infrastructure."""

import logging
from uuid import UUID

from app.application.interfaces.agent_repository import AgentRepositoryInterface
from app.domain.agents.entities import (
    AgentEntity,
    CapabilityEntity,
    IntegrationEntity,
)
from app.domain.agents.schemas import (
    AgentCreate,
    AgentGenerationResponse,
    AgentResponse,
    AgentTemplateResponse,
    AgentUpdate,
    MoodResponse,
)
from app.infrastructure.external.openrouter import structured_completion

logger = logging.getLogger(__name__)


def _build_agent_response(agent: AgentEntity) -> AgentResponse:
    """Construct an AgentResponse from a pure AgentEntity."""
    cap_ids = [cap.id for cap in agent.capabilities]
    integration_ids = [ai.integration_id for ai in agent.agent_integrations if ai.enabled]
    integration_configs = {
        ai.integration_id: ai.config for ai in agent.agent_integrations if ai.enabled and ai.config
    }
    return AgentResponse(
        id=agent.id,
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


class AgentUseCases:
    def __init__(self, repo: AgentRepositoryInterface):
        self.repo = repo
        self._cached_capabilities: list[CapabilityEntity] | None = None
        self._cached_integrations: list[IntegrationEntity] | None = None

    async def list_capabilities(self) -> list[CapabilityEntity]:
        if self._cached_capabilities is None:
            self._cached_capabilities = await self.repo.list_capabilities()
        return self._cached_capabilities

    async def list_integrations(self) -> list[IntegrationEntity]:
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
        sections = [
            f"You are {name}.",
            (
                "Respond naturally and concisely like a real person in a chat. "
                "Never introduce yourself, announce your capabilities, or explain what you can do "
                "unless the user specifically asks. Just answer helpfully and directly."
            ),
        ]
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
            sections.append(
                f"\nYou have access to the following tools: {cap_list}. "
                "Use them proactively when the user's request calls for it, "
                "but do not mention or advertise them."
            )
        return "\n".join(sections)

    async def create_agent(self, agent_data: AgentCreate, user_id: UUID) -> AgentResponse:
        system_prompt = agent_data.system_prompt or await self.build_system_prompt(
            name=agent_data.name,
            personality=agent_data.personality,
            description=agent_data.description,
            goals=agent_data.goals,
            capability_ids=agent_data.capabilities,
        )

        agent = await self.repo.create_agent(
            user_id=user_id,
            name=agent_data.name,
            personality=agent_data.personality,
            description=agent_data.description,
            goals=agent_data.goals,
            system_prompt=system_prompt,
        )

        if agent_data.capabilities:
            await self.repo.set_capabilities(agent.id, agent_data.capabilities)

        if agent_data.integrations:
            await self.repo.set_integrations(
                agent.id, agent_data.integrations, agent_data.integration_configs
            )

        refetched = await self.repo.get_by_id(agent.id)
        assert refetched is not None
        return _build_agent_response(refetched)

    async def list_agents(self, user_id: UUID) -> list[AgentResponse]:
        agents = await self.repo.list_by_user(user_id)
        return [_build_agent_response(a) for a in agents]

    async def generate_agent_profile(self, keywords: str) -> AgentGenerationResponse:
        messages = [
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

    async def update_agent(
        self, agent_id: UUID | str, user_id: UUID, data: AgentUpdate
    ) -> AgentResponse | None:
        agent = await self.repo.get_by_id(agent_id)
        if not agent or str(agent.user_id) != str(user_id):
            return None

        fields = data.model_dump(exclude_none=True)

        new_capability_ids = fields.pop("capabilities", None)
        if new_capability_ids is not None:
            await self.repo.set_capabilities(agent_id, new_capability_ids)
            effective_cap_ids = new_capability_ids
        else:
            effective_cap_ids = await self.repo.get_capability_ids(agent_id)

        new_integration_ids = fields.pop("integrations", None)
        new_integration_configs = fields.pop("integration_configs", None) or {}
        if new_integration_ids is not None:
            await self.repo.set_integrations(agent_id, new_integration_ids, new_integration_configs)

        name = fields.get("name", agent.name)
        personality = fields.get("personality", agent.personality)
        description = fields.get("description", agent.description)
        goals = fields.get("goals", agent.goals)

        updated_prompt = await self.build_system_prompt(
            name=name,
            personality=personality,
            description=description,
            goals=goals,
            capability_ids=effective_cap_ids or None,
        )
        fields["system_prompt"] = updated_prompt

        updated = await self.repo.update_agent(agent_id, user_id, **fields)
        if not updated:
            return None
        return _build_agent_response(updated)

    async def delete_agent(self, agent_id: UUID | str, user_id: UUID) -> bool:
        return await self.repo.delete_agent(agent_id, user_id)

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateResponse]:
        templates = await self.repo.list_templates(skip=skip, limit=limit)
        return [
            AgentTemplateResponse(
                id=t.id,
                name=t.name,
                description=t.description,
                personality=t.personality,
                goals=t.goals,
                created_at=t.created_at,
            )
            for t in templates
        ]

    _VALID_MOODS = (
        "Neutral",
        "Optimistic",
        "Happy",
        "Curious",
        "Focused",
        "Excited",
        "Calm",
        "Playful",
        "Serious",
        "Creative",
    )

    async def update_mood(self, agent_id: UUID | str, recent_history: str) -> None:
        if not recent_history.strip():
            return
        mood_list = ", ".join(self._VALID_MOODS)
        try:
            response = await structured_completion(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are a mood classifier. Given a conversation excerpt, "
                            f"pick the single most fitting mood for the AI agent from this list: "
                            f"{mood_list}."
                        ),
                    },
                    {"role": "user", "content": recent_history},
                ],
                response_model=MoodResponse,
            )
            mood = response.mood.strip().capitalize()
            if mood not in self._VALID_MOODS:
                mood = "Neutral"
        except Exception:
            logger.warning("Mood inference failed for agent %s, keeping current mood", agent_id)
            return
        await self.repo.update_mood(agent_id, mood)
