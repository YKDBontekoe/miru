"""Agent repository interface definition."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from app.domain.agents.entities import (
    AgentEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)


class AgentRepositoryInterface(ABC):
    """Abstract base class for agent data access."""

    @abstractmethod
    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all available capabilities."""
        pass

    @abstractmethod
    async def list_integrations(self) -> list[IntegrationEntity]:
        """List all available integrations."""
        pass

    @abstractmethod
    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        """Fetch a single agent by ID."""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        """List all agents for a user."""
        pass

    @abstractmethod
    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        """List agent templates (paginated)."""
        pass

    @abstractmethod
    async def create_agent(
        self,
        user_id: UUID,
        name: str,
        personality: str,
        description: str | None,
        goals: list[str],
        system_prompt: str | None,
        capability_ids: list[str] | None = None,
        integrations_data: list[dict[str, Any]] | None = None,
    ) -> AgentEntity:
        """Create a new agent along with capabilities and integrations."""
        pass

    @abstractmethod
    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        pass

    @abstractmethod
    async def update_agent(
        self,
        agent_id: UUID | str,
        user_id: UUID | str,
        fields: dict[str, Any],
        new_capability_ids: list[str] | None = None,
        new_integrations_data: list[dict[str, Any]] | None = None,
    ) -> AgentEntity | None:
        """Update an agent's fields and M2M relationships."""
        pass

    @abstractmethod
    async def delete_agent(self, agent_id: UUID | str, user_id: UUID | str) -> bool:
        """Soft-delete an agent."""
        pass

    @abstractmethod
    async def increment_message_count(self, agent_id: UUID | str) -> None:
        """Increment an agent's message count."""
        pass

    @abstractmethod
    async def upsert_affinity(
        self, user_id: UUID, agent_id: UUID, score_delta: float = 1.0
    ) -> None:
        """Increment affinity score, unlock milestones, and update trust level."""
        pass
