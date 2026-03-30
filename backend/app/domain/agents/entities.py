"""Pure Python domain entities for Agents."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class CapabilityEntity:
    """Domain entity for Agent Capabilities."""

    id: str
    name: str
    description: str
    icon: str
    status: str
    created_at: datetime


@dataclass
class IntegrationEntity:
    """Domain entity for external service definitions."""

    id: str
    display_name: str
    description: str
    icon: str
    status: str
    config_schema: list | dict
    created_at: datetime


@dataclass
class AgentIntegrationEntity:
    """Domain entity representing a connection between an Agent and an Integration."""

    id: UUID
    agent_id: UUID
    integration_id: str
    enabled: bool
    config: dict
    credentials: dict
    connected_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass
class AgentEntity:
    """Domain entity for Agents."""

    id: UUID
    user_id: UUID
    name: str
    personality: str
    description: str | None
    system_prompt: str | None
    status: str
    mood: str
    goals: list[str]
    message_count: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    # Associated domain objects
    capabilities: list[CapabilityEntity] = field(default_factory=list)
    agent_integrations: list[AgentIntegrationEntity] = field(default_factory=list)


@dataclass
class AgentTemplateEntity:
    """Domain entity for agent templates."""

    id: UUID
    name: str
    description: str
    personality: str
    goals: list[str]
    created_at: datetime
    capabilities: list[CapabilityEntity] = field(default_factory=list)
