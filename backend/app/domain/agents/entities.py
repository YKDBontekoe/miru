"""Pure domain entities for Agents."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID


def _utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass
class AgentEntity:
    """Domain Entity representing an Agent."""

    id: UUID
    user_id: UUID
    name: str
    personality: str
    description: str | None = None
    system_prompt: str | None = None
    status: str = "active"
    mood: str = "Neutral"
    goals: list = field(default_factory=list)
    message_count: int = 0
    capability_ids: list[str] = field(default_factory=list)
    integration_ids: list[str] = field(default_factory=list)
    integration_configs: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)
    deleted_at: datetime | None = None


@dataclass
class CapabilityEntity:
    """Domain Entity representing an Agent Capability."""

    id: str
    name: str
    description: str
    icon: str
    status: str = "active"
    created_at: datetime = field(default_factory=_utcnow)


@dataclass
class IntegrationEntity:
    """Domain Entity representing an External Service Definition."""

    id: str
    display_name: str
    description: str
    icon: str
    status: str = "active"
    config_schema: list | dict = field(default_factory=list)
    created_at: datetime = field(default_factory=_utcnow)


@dataclass
class AgentIntegrationEntity:
    """Domain Entity representing an Agent Integration."""

    id: UUID
    agent_id: UUID
    integration_id: str
    enabled: bool = True
    config: dict = field(default_factory=dict)
    credentials: dict = field(default_factory=dict)
    connected_at: datetime | None = None
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)


@dataclass
class AgentTemplateEntity:
    """Domain Entity representing an Agent Template."""

    id: UUID
    name: str
    description: str
    personality: str
    goals: list = field(default_factory=list)
    created_at: datetime = field(default_factory=_utcnow)


@dataclass
class UserAgentAffinityEntity:
    """Domain Entity representing User-Agent Affinity."""

    user_id: UUID
    agent_id: UUID
    affinity_score: float = 0.0
    trust_level: int = 1
    milestones: list = field(default_factory=list)
    last_interaction_at: datetime = field(default_factory=_utcnow)
    created_at: datetime = field(default_factory=_utcnow)


@dataclass
class AgentActionLogEntity:
    """Domain Entity representing an Agent Action Log."""

    id: UUID
    user_id: UUID
    agent_id: UUID
    room_id: UUID | None = None
    action_type: str = ""
    content: str = ""
    meta: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utcnow)
