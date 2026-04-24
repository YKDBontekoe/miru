from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.agents.models import Agent, AgentTemplate, Capability, Integration


class IAgentRepository(Protocol):
    """Interface for Agent persistence operations.

    Provides methods to query and mutate Agent entities and their associated
    data, abstracting away the underlying database technology.
    """

    async def list_capabilities(self) -> list[Capability]:
        """List all available capabilities."""
        ...

    async def list_integrations(self) -> list[Integration]:
        """List all available integrations."""
        ...

    async def get_by_id(self, agent_id: UUID | str) -> Agent | None:
        """Fetch a single agent by ID."""
        ...

    async def list_by_user(self, user_id: UUID | str) -> list[Agent]:
        """List all agents owned by a specific user."""
        ...

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplate]:
        """List available agent templates."""
        ...

    async def create(self, agent: Agent) -> Agent:
        """Create a new agent."""
        ...

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's current mood."""
        ...

    async def update_agent(
        self, agent_id: UUID | str, user_id: UUID | str, **fields: object
    ) -> Agent | None:
        """Update specific fields of an agent."""
        ...

    async def delete_agent(self, agent_id: UUID | str, user_id: UUID | str) -> bool:
        """Soft-delete an agent."""
        ...

    async def increment_message_count(self, agent_id: UUID | str) -> None:
        """Increment the total message count for an agent."""
        ...

    async def upsert_affinity(
        self, user_id: UUID | str, agent_id: UUID | str, score_delta: float = 1.0
    ) -> None:
        """Increment affinity score and unlock milestones for a user-agent relationship."""
        ...
