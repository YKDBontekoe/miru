"""Agent repository using Tortoise ORM."""

from __future__ import annotations

from uuid import UUID

from app.domain.agents.models import Agent, Capability, Integration


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

    async def get_by_id(
        self, agent_id: UUID | str, user_id: UUID | str | None = None
    ) -> Agent | None:
        """Fetch a single agent by ID, with capabilities prefetched."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)

        # SEC(agent): Prevents IDOR by verifying agent ownership if user_id is provided
        query = Agent.get_or_none(id=agent_id)
        if user_id:
            if isinstance(user_id, str):
                user_id = UUID(user_id)
            query = Agent.get_or_none(id=agent_id, user_id=user_id)

        return await query.prefetch_related("capabilities", "agent_integrations__integration")

    async def list_by_user(self, user_id: UUID | str) -> list[Agent]:
        """List all agents for a user, with capabilities and integrations prefetched."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        return (
            await Agent.filter(user_id=user_id)
            .prefetch_related("capabilities", "agent_integrations__integration")
            .all()
        )

    async def create(self, agent: Agent) -> Agent:
        """Create a new agent."""
        await agent.save()
        return agent

    async def update_mood(
        self, agent_id: UUID | str, mood: str, user_id: UUID | str | None = None
    ) -> None:
        """Update an agent's mood."""
        agent = await self.get_by_id(agent_id, user_id)
        if agent:
            agent.mood = mood
            await agent.save()

    async def increment_message_count(
        self, agent_id: UUID | str, user_id: UUID | str | None = None
    ) -> None:
        """Increment an agent's message count."""
        agent = await self.get_by_id(agent_id, user_id)
        if agent:
            agent.message_count += 1
            await agent.save()
