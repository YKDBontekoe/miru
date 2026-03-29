"""Pure domain entities for Agents."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID


def _utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass
class CapabilityEntity:
    """Domain Entity representing an Agent Capability."""

    id: str
    name: str
    description: str
    icon: str
    status: str
    created_at: datetime


@dataclass
class IntegrationEntity:
    """Domain Entity representing an Integration."""

    id: str
    display_name: str
    description: str
    icon: str
    status: str
    config_schema: list | dict
    created_at: datetime


@dataclass
class AgentIntegrationEntity:
    """Domain Entity representing an Agent's Integration configuration."""

    id: UUID
    agent_id: UUID
    integration_id: str
    enabled: bool
    config: dict[str, Any]
    credentials: dict[str, Any]
    connected_at: datetime | None
    created_at: datetime
    updated_at: datetime


@dataclass
class AgentEntity:
    """Domain Entity representing an Agent."""

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
    personality_history: list[dict]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    capabilities: list[CapabilityEntity] = field(default_factory=list)
    agent_integrations: list[AgentIntegrationEntity] = field(default_factory=list)


@dataclass
class AgentTemplateEntity:
    """Domain Entity representing an Agent Template."""

    id: UUID
    name: str
    description: str
    personality: str
    goals: list[str]
    created_at: datetime
    capabilities: list[CapabilityEntity] = field(default_factory=list)


@dataclass
class UserAgentAffinityEntity:
    """Domain Entity representing the relationship strength between a user and an agent."""

    user_id: UUID
    agent_id: UUID
    affinity_score: float
    trust_level: int
    milestones: list[str]
    last_interaction_at: datetime
    created_at: datetime
