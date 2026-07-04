"""Repository interface for agents domain."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.agents.entities import (
    AgentEntity,
    AgentTemplateEntity,
    CapabilityEntity,
    IntegrationEntity,
)


class IAgentRepository(Protocol):
    """Protocol defining the repository operations for the agents domain."""

    async def list_capabilities(self) -> list[CapabilityEntity]:
        ...

    async def list_integrations(self) -> list[IntegrationEntity]:
        ...

    async def get_by_id(self, agent_id: UUID | str) -> AgentEntity | None:
        ...

    async def list_by_user(self, user_id: UUID | str) -> list[AgentEntity]:
        ...

    async def list_templates(self, skip: int = 0, limit: int = 100) -> list[AgentTemplateEntity]:
        ...

    async def create_agent(
        self,
        user_id: UUID,
        agent_data: dict,
        system_prompt: str,
        capabilities: list[str] | None,
        integrations: list[str] | None,
        integration_configs: dict | None
    ) -> AgentEntity:
        ...

    async def update_agent(
        self,
        agent_id: UUID | str,
        user_id: UUID | str,
        agent_data: dict,
        system_prompt: str | None,
        capabilities: list[str] | None,
        integrations: list[str] | None,
        integration_configs: dict | None
    ) -> AgentEntity | None:
        ...

    async def delete_agent(self, agent_id: UUID | str, user_id: UUID | str) -> bool:
        ...

    async def update_mood(self, agent_id: UUID | str, mood: str) -> None:
        ...

    async def increment_message_count(self, agent_id: UUID | str) -> None:
        ...

    async def upsert_affinity(
        self, user_id: UUID, agent_id: UUID, score_delta: float = 1.0
    ) -> None:
        ...
