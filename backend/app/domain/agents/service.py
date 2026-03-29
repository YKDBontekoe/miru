"""Agent service for business logic."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from app.domain.agents.entities import AgentEntity, CapabilityEntity, IntegrationEntity
from app.domain.agents.schemas import (
    AffinityResponse,
    AgentCreate,
    AgentGenerationResponse,
    AgentResponse,
    AgentTemplateResponse,
    AgentUpdate,
    MoodResponse,
    NudgeCheckResponse,
    PersonalityDriftResponse,
)
from app.infrastructure.external.openrouter import structured_completion

if TYPE_CHECKING:
    from uuid import UUID

    from openai.types.chat import ChatCompletionMessageParam

    from app.domain.notifications.services import NotificationService
    from app.infrastructure.repositories.agent_repo import AgentRepository

logger = logging.getLogger(__name__)


def _build_agent_response(agent: AgentEntity) -> AgentResponse:
    """Construct an AgentResponse from an AgentEntity."""
    cap_ids: list[str] = [cap.id for cap in agent.capabilities]
    integration_ids: list[str] = [
        ai.integration_id for ai in agent.agent_integrations if ai.enabled
    ]
    integration_configs: dict = {
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


class AgentService:
    def __init__(self, repo: AgentRepository):
        self.repo = repo
        self._cached_capabilities: list[CapabilityEntity] | None = None
        self._cached_integrations: list[IntegrationEntity] | None = None

    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all capabilities from the database."""
        # Justification: Cache capabilities per-request to avoid redundant DB queries
        # when building prompts for multiple agents or repeatedly verifying capabilities.
        if self._cached_capabilities is None:
            self._cached_capabilities = await self.repo.list_capabilities()
        return self._cached_capabilities

    async def list_integrations(self) -> list[IntegrationEntity]:
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
        """Onboard a new agent with a built system prompt."""
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
            system_prompt=system_prompt,
            description=agent_data.description,
            goals=agent_data.goals,
            capability_ids=agent_data.capabilities,
            integration_ids=agent_data.integrations,
            integration_configs=agent_data.integration_configs,
        )

        return _build_agent_response(agent)

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

    async def update_agent(
        self, agent_id: UUID | str, user_id: UUID, data: AgentUpdate
    ) -> AgentResponse | None:
        """Update an agent's profile fields and rebuild system prompt in one write.

        If ``capabilities`` or ``integrations`` are supplied the M2M relations are
        replaced and the system prompt is rebuilt to reflect the new configuration.
        """
        agent = await self.repo.get_by_id(agent_id)
        if not agent or str(agent.user_id) != str(user_id):
            return None

        fields = data.model_dump(exclude_none=True)

        # --- capabilities ---
        new_capability_ids: list[str] | None = fields.pop("capabilities", None)
        if new_capability_ids is not None:
            effective_cap_ids = new_capability_ids
        else:
            effective_cap_ids = [str(c.id) for c in agent.capabilities]

        # --- integrations ---
        new_integration_ids: list[str] | None = fields.pop("integrations", None)
        new_integration_configs: dict = fields.pop("integration_configs", None) or {}

        # Merge profile fields with current values so build_system_prompt has full context
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

        updated = await self.repo.update_agent(
            agent_id,
            user_id,
            capability_ids=new_capability_ids,
            integration_ids=new_integration_ids,
            integration_configs=new_integration_configs,
            **fields,
        )
        if not updated:
            return None
        return _build_agent_response(updated)

    async def delete_agent(self, agent_id: UUID | str, user_id: UUID) -> bool:
        """Soft-delete an agent owned by user_id."""
        return await self.repo.delete_agent(agent_id, user_id)

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateResponse]:
        """Return available agent persona templates (paginated)."""
        templates = await self.repo.list_templates(skip=skip, limit=limit)
        return [AgentTemplateResponse.model_validate(t) for t in templates]

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

    async def get_affinity(self, user_id: UUID, agent_id: UUID) -> AffinityResponse | None:
        """Return the affinity record for a user-agent pair, or None if no interactions yet."""
        from uuid import UUID as _UUID

        if isinstance(agent_id, str):
            agent_id = _UUID(agent_id)
        if isinstance(user_id, str):
            user_id = _UUID(user_id)
        record = await self.repo.get_affinity(user_id, agent_id)
        if record is None:
            return None
        return AffinityResponse(
            agent_id=agent_id,
            affinity_score=record.affinity_score,
            trust_level=record.trust_level,
            milestones=list(record.milestones or []),
            last_interaction_at=record.last_interaction_at,
        )

    async def check_proactive_nudges(
        self,
        user_id: UUID,
        notification_service: NotificationService | None = None,
    ) -> NudgeCheckResponse:
        """Scan for patterns that warrant a push notification and fire them.

        Checks performed:
        - Agents the user hasn't interacted with in >7 days.
        - Overdue tasks (handled by the caller passing in task data).

        Returns the number of nudges sent and a human-readable summary.
        """
        from uuid import UUID as _UUID

        if isinstance(user_id, str):
            user_id = _UUID(user_id)

        agents = await self.repo.list_by_user(user_id)
        nudges_sent = 0
        details: list[str] = []
        now = datetime.now(UTC)

        for agent in agents:
            affinity = await self.repo.get_affinity(user_id, agent.id)
            if affinity is None:
                continue
            days_since = (now - affinity.last_interaction_at.replace(tzinfo=UTC)).days
            if days_since >= 7:
                msg = (
                    f"{agent.name} misses you! It's been {days_since} days since you last chatted."
                )
                if notification_service is not None:
                    try:
                        await notification_service.notify_user(
                            str(user_id), msg, title=f"Say hi to {agent.name}!"
                        )
                        nudges_sent += 1
                        details.append(msg)
                    except Exception:
                        logger.warning("Failed to send nudge for agent %s", agent.id)

        return NudgeCheckResponse(nudges_sent=nudges_sent, details=details)

    async def update_personality_drift(
        self, agent_id: UUID | str, recent_history: str
    ) -> str | None:
        """Suggest a personality refinement based on recent conversation history.

        The new personality is appended to `personality_history` for traceability
        and saved as the active `personality` on the agent.  Returns the new
        personality string, or None if no change was warranted.
        """
        if not recent_history.strip():
            return None
        agent = await self.repo.get_by_id(agent_id)
        if not agent:
            return None
        try:
            response = await structured_completion(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a character evolution director. Given an AI agent's current "
                            "personality and their recent conversation history, suggest a subtle "
                            "refinement that reflects how the agent is growing. Keep the same "
                            "tone and style but incorporate nuances observed in the conversations. "
                            "The updated_personality should be ≤300 words."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Current personality:\n{agent.personality}\n\n"
                            f"Recent conversations:\n{recent_history}"
                        ),
                    },
                ],
                response_model=PersonalityDriftResponse,
            )
        except Exception:
            logger.warning("Personality drift inference failed for agent %s", agent_id)
            return None

        new_personality = response.updated_personality.strip()
        if not new_personality or new_personality == agent.personality:
            return None

        history: list = list(agent.personality_history or [])
        history.append(
            {
                "date": datetime.now(UTC).isoformat(),
                "personality": agent.personality,
                "trigger": "conversation_drift",
                "summary": response.summary,
            }
        )
        await self.repo.update_agent(
            agent_id,
            agent.user_id,
            personality=new_personality,
            personality_history=history,
        )
        return new_personality

    async def update_mood(self, agent_id: UUID | str, recent_history: str) -> None:
        """Infer agent mood from recent conversation history and persist it."""
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
