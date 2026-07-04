"""Plain Domain Entities for Agents."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class CapabilityEntity:
    id: str
    name: str
    description: str
    icon: str
    status: str
    created_at: datetime


@dataclass
class IntegrationEntity:
    id: str
    display_name: str
    description: str
    icon: str
    status: str
    config_schema: list | dict
    created_at: datetime


@dataclass
class AgentTemplateEntity:
    id: UUID
    name: str
    description: str
    personality: str
    goals: list[str]
    created_at: datetime


@dataclass
class AgentEntity:
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
    capabilities: list[str] = field(default_factory=list)
    integrations: list[str] = field(default_factory=list)
    integration_configs: dict = field(default_factory=dict)
