"""Agent repository interface defining domain contract."""

import abc
from uuid import UUID

from app.domain.agents.entities import (
    AgentEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)


class AgentRepositoryInterface(abc.ABC):
    """Abstract repository dealing purely with Agent domain entities."""

    @abc.abstractmethod
    async def list_capabilities(self) -> list[CapabilityEntity]:
        """List all capabilities."""
        pass

    @abc.abstractmethod
    async def list_integrations(self) -> list[IntegrationEntity]:
        """List all integrations."""
        pass

    @abc.abstractmethod
    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        """Fetch an agent by ID with its capabilities and integrations."""
        pass

    @abc.abstractmethod
    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        """List all agents for a user."""
        pass

    @abc.abstractmethod
    async def create_agent(
        self,
        user_id: UUID | str,
        name: str,
        personality: str,
        description: str | None,
        goals: list[str] | None,
        system_prompt: str | None,
    ) -> AgentEntity:
        """Create a new agent."""
        pass

    @abc.abstractmethod
    async def set_capabilities(self, agent_id: UUID | str, capability_ids: list[str]) -> None:
        """Set capabilities for an agent."""
        pass

    @abc.abstractmethod
    async def get_capability_ids(self, agent_id: UUID | str) -> list[str]:
        """Get capability IDs for an agent."""
        pass

    @abc.abstractmethod
    async def set_integrations(
        self,
        agent_id: UUID | str,
        integration_ids: list[str],
        integration_configs: dict,
    ) -> None:
        """Set integrations for an agent."""
        pass

    @abc.abstractmethod
    async def update_agent(
        self, agent_id: UUID | str, user_id: UUID | str, **fields
    ) -> AgentEntity | None:
        """Update an agent."""
        pass

    @abc.abstractmethod
    async def delete_agent(self, agent_id: UUID | str, user_id: UUID | str) -> bool:
        """Delete an agent."""
        pass

    @abc.abstractmethod
    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        """List available agent persona templates (paginated)."""
        pass

    @abc.abstractmethod
    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        """Update an agent's mood."""
        pass
