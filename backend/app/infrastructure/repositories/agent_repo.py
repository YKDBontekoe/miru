"""Agent repository for SQLModel operations."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import select

from app.domain.agents.models import Agent

if TYPE_CHECKING:
    from sqlmodel.ext.asyncio.session import AsyncSession


class AgentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, agent_id: UUID | str) -> Agent | None:
        """Fetch a single agent by ID."""
        if isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        return await self.session.get(Agent, agent_id)

    async def list_by_user(self, user_id: UUID | str) -> list[Agent]:
        """List all agents for a user."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        statement = select(Agent).where(Agent.user_id == user_id)
        result = await self.session.exec(statement)
        return list(result.all())

    async def create(self, agent: Agent) -> Agent:
        """Create a new agent."""
        self.session.add(agent)
        await self.session.commit()
        await self.session.refresh(agent)
        return agent

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        agent = await self.get_by_id(agent_id)
        if agent:
            agent.mood = mood
            self.session.add(agent)
            await self.session.commit()

    async def increment_message_count(self, agent_id: UUID | str) -> None:
        """Increment an agent's message count."""
        agent = await self.get_by_id(agent_id)
        if agent:
            agent.message_count += 1
            self.session.add(agent)
            await self.session.commit()
