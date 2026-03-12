"""Agent service for business logic."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.domain.agents.models import (
    Agent,
    AgentCreate,
    AgentGenerationResponse,
)
from app.infrastructure.external.openrouter import structured_completion

if TYPE_CHECKING:
    from uuid import UUID

    from openai.types.chat import ChatCompletionMessageParam

    from app.infrastructure.repositories.agent_repo import AgentRepository

logger = logging.getLogger(__name__)

AVAILABLE_INTEGRATIONS = [
    {
        "type": "steam",
        "display_name": "Steam",
        "description": "View Steam games and activity...",
        "icon": "videogame_asset",
        "status": "active",
    },
    {
        "type": "spotify",
        "display_name": "Spotify",
        "description": "Play music...",
        "icon": "music_note",
        "status": "coming_soon",
    },
    {
        "type": "discord",
        "display_name": "Discord",
        "description": "Send messages...",
        "icon": "forum",
        "status": "coming_soon",
    },
]

AVAILABLE_CAPABILITIES = [
    {
        "id": "web_search",
        "name": "Web Search",
        "description": "Search the internet...",
        "icon": "search",
    },
    {
        "id": "code_execution",
        "name": "Code Execution",
        "description": "Write and run code...",
        "icon": "terminal",
    },
]


class AgentService:
    def __init__(self, repo: AgentRepository):
        self.repo = repo

    def build_system_prompt(
        self,
        name: str,
        personality: str,
        description: str | None = None,
        goals: list[str] | None = None,
        capabilities: list[str] | None = None,
    ) -> str:
        """Build a rich system prompt from agent profile fields."""
        sections = [f"You are {name}."]
        if description:
            sections.append(description)
        sections.append(f"\nPersonality & Behavior:\n{personality}")
        if goals:
            goal_list = "\n".join(f"- {g}" for g in goals)
            sections.append(f"\nYour Goals:\n{goal_list}")
        if capabilities:
            cap_names = [c["name"] for c in AVAILABLE_CAPABILITIES if c["id"] in capabilities]
            cap_list = ", ".join(cap_names)
            sections.append(f"\nYou have the following capabilities: {cap_list}.")
        return "\n".join(sections)

    async def create_agent(self, agent_data: AgentCreate, user_id: UUID) -> Agent:
        """Onboard a new agent with a built system prompt."""
        system_prompt = agent_data.system_prompt or self.build_system_prompt(
            name=agent_data.name,
            personality=agent_data.personality,
            description=agent_data.description,
            goals=agent_data.goals,
            capabilities=agent_data.capabilities,
        )

        agent = Agent(
            user_id=user_id,
            name=agent_data.name,
            personality=agent_data.personality,
            description=agent_data.description,
            goals=agent_data.goals,
            capabilities=agent_data.capabilities,
            integrations=agent_data.integrations,
            system_prompt=system_prompt,
        )
        return await self.repo.create(agent)

    async def list_agents(self, user_id: UUID) -> list[Agent]:
        """List all agents for a user."""
        return await self.repo.list_by_user(user_id)

    async def generate_agent_profile(self, keywords: str) -> AgentGenerationResponse:
        """Use Instructor to generate a validated agent profile."""
        messages: list[ChatCompletionMessageParam] = [
            {
                "role": "system",
                "content": "You are a creative director for AI personas. Create a unique, high-quality persona based on the user's keywords.",
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
