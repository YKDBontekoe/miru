"""Agent domain models using Tortoise ORM and Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


class Agent(SupabaseModel):
    """Database entity for Agents."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
    name = fields.CharField(max_length=100, db_index=True)
    personality = fields.TextField()
    description = fields.TextField(null=True)
    system_prompt = fields.TextField(null=True)
    status = fields.CharField(max_length=20, default="active")
    mood = fields.CharField(max_length=50, default="Neutral")

    capabilities: fields.ManyToManyRelation[Capability] = fields.ManyToManyField(
        "models.Capability", related_name="agents", table="agents_capabilities"
    )
    goals = fields.JSONField(default=[])
    agent_integrations: fields.ReverseRelation[AgentIntegration]

    message_count = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "agents"
        sql_policies = [
            "ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY agents_owner_all ON public.agents FOR ALL USING (auth.uid() = user_id);",
        ]


class Capability(SupabaseModel):
    """Database entity for Agent Capabilities."""

    id = fields.CharField(primary_key=True, max_length=50)
    name = fields.CharField(max_length=100)
    description = fields.TextField()
    icon = fields.CharField(max_length=50)
    status = fields.CharField(max_length=20, default="active")
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "capabilities"
        sql_policies = [
            "ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY capabilities_select_all ON public.capabilities FOR SELECT USING (true);",
        ]


class Integration(SupabaseModel):
    """Database entity for external service definitions (e.g. Steam)."""

    id = fields.CharField(primary_key=True, max_length=50)
    display_name = fields.CharField(max_length=100)
    description = fields.TextField()
    icon = fields.CharField(max_length=50)
    status = fields.CharField(max_length=20, default="active")
    config_schema = fields.JSONField(default=[])
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "integrations"
        sql_policies = [
            "ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY integrations_select_all ON public.integrations FOR SELECT USING (true);",
        ]


class AgentIntegration(SupabaseModel):
    """Junction table for Agents and their specific service connections."""

    id = fields.UUIDField(primary_key=True)
    agent: fields.ForeignKeyRelation[Agent] = fields.ForeignKeyField(
        "models.Agent", related_name="agent_integrations", on_delete=fields.CASCADE
    )
    integration: fields.ForeignKeyRelation[Integration] = fields.ForeignKeyField(
        "models.Integration", related_name="connected_agents", on_delete=fields.CASCADE
    )
    integration_id: str  # Tortoise ORM FK column accessor

    enabled = fields.BooleanField(default=True)
    config = fields.JSONField(default={})
    credentials = fields.JSONField(default={})

    connected_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "agent_integrations"
        unique_together = (("agent", "integration"),)
        sql_policies = [
            "ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY agent_integrations_owner_all ON public.agent_integrations "
            "FOR ALL USING (EXISTS ("
            "SELECT 1 FROM agents WHERE id = agent_id AND user_id = auth.uid()"
            "));",
        ]


class AgentTemplate(SupabaseModel):
    """Template for creating new agents."""

    id = fields.UUIDField(primary_key=True)
    name = fields.CharField(max_length=100)
    description = fields.TextField()
    personality = fields.TextField()
    goals = fields.JSONField(default=[])

    capabilities: fields.ManyToManyRelation[Capability] = fields.ManyToManyField(
        "models.Capability", related_name="templates", table="agent_templates_capabilities"
    )

    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "agent_templates"
        sql_policies = [
            "ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY agent_templates_select_all ON public.agent_templates "
            "FOR SELECT USING (true);",
        ]


class UserAgentAffinity(SupabaseModel):
    """Tracks relationship strength between a user and an agent."""

    user_id = fields.UUIDField()
    agent: fields.ForeignKeyRelation[Agent] = fields.ForeignKeyField(
        "models.Agent", related_name="affinities", on_delete=fields.CASCADE
    )
    affinity_score = fields.FloatField(default=0.0)
    trust_level = fields.IntField(default=1)
    milestones = fields.JSONField(default=[])
    last_interaction_at = fields.DatetimeField(auto_now=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "user_agent_affinity"
        unique_together = (("user_id", "agent"),)
        sql_policies = [
            "ALTER TABLE public.user_agent_affinity ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY user_agent_affinity_owner ON public.user_agent_affinity "
            "FOR ALL USING (auth.uid() = user_id);",
        ]


class AgentActionLog(SupabaseModel):
    """Audit log of agent thoughts and tool usage."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(db_index=True)
    agent: fields.ForeignKeyRelation[Agent] = fields.ForeignKeyField(
        "models.Agent", related_name="action_logs", on_delete=fields.CASCADE
    )
    # Any is intentionally chosen to avoid import cycles. The string reference "models.ChatRoom"
    # preserves correct ORM behavior at runtime. Do not replace Any with ChatRoom.
    room: fields.ForeignKeyRelation[Any] | None = fields.ForeignKeyField(
        "models.ChatRoom",
        related_name="agent_action_logs",
        on_delete=fields.SET_NULL,
        null=True,
    )
    action_type = fields.CharField(max_length=50)
    content = fields.TextField()
    meta = fields.JSONField(default={})
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "agent_action_logs"
        sql_policies = [
            "ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY agent_action_logs_owner_select ON public.agent_action_logs "
            "FOR SELECT USING (auth.uid() = user_id);",
            "CREATE POLICY agent_action_logs_owner_insert ON public.agent_action_logs "
            "FOR INSERT WITH CHECK (auth.uid() = user_id);",
        ]


# ---------------------------------------------------------------------------
# API Pydantic Schemas
# ---------------------------------------------------------------------------


class CapabilityResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    status: str
    created_at: datetime


class IntegrationResponse(BaseModel):
    id: str
    display_name: str
    description: str
    icon: str
    status: str
    config_schema: list | dict
    created_at: datetime


class AgentBase(BaseModel):
    """Shared fields for Agent schemas."""

    name: str = Field(max_length=100)
    personality: str = Field(max_length=1000)
    description: str | None = Field(default=None, max_length=500)
    system_prompt: str | None = Field(default=None)
    status: str = Field(default="active")
    mood: str = Field(default="Neutral")


class AgentCreate(AgentBase):
    """Schema for creating a new agent."""

    goals: list[str] = []
    capabilities: list[str] = []
    integrations: list[str] = []
    integration_configs: dict = Field(default_factory=dict)


class AgentResponse(AgentBase):
    """Schema for returning agent data."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    goals: list[str] = []
    capabilities: list[str] = []
    integrations: list[str] = []
    integration_configs: dict = Field(default_factory=dict)
    message_count: int
    created_at: datetime
    updated_at: datetime

    @field_validator("capabilities", mode="before")
    @classmethod
    def extract_capabilities(cls, v: Any) -> list[str]:
        """Extract capability IDs from a prefetched Tortoise M2M relation or plain list."""
        if hasattr(v, "related_objects"):
            return [obj.pk for obj in v.related_objects]
        return list(v) if v else []

    @field_validator("integrations", mode="before")
    @classmethod
    def extract_integrations(cls, v: Any) -> list[str]:
        """Extract integration IDs from prefetched agent_integrations or plain list."""
        if hasattr(v, "related_objects"):
            return [obj.pk for obj in v.related_objects]
        if hasattr(v, "__iter__") and not isinstance(v, (str, dict)):
            items = list(v)
            if items and hasattr(items[0], "integration_id"):
                return [item.integration_id for item in items if item.enabled]
            return [str(item) for item in items]
        return list(v) if v else []


class AgentTemplateResponse(BaseModel):
    """Schema for returning agent template data."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str
    personality: str
    goals: list[str] = []
    created_at: datetime


class AgentUpdate(BaseModel):
    """Schema for updating an existing agent."""

    name: str | None = Field(default=None, max_length=100)
    personality: str | None = Field(default=None, max_length=1000)
    description: str | None = Field(default=None, max_length=500)
    goals: list[str] | None = None


class AgentGenerate(BaseModel):
    """Input for AI-powered agent generation."""

    keywords: str


class AgentGenerationResponse(BaseModel):
    """Full agent profile generated by AI."""

    name: str
    personality: str
    description: str
    capabilities: list[str] = Field(
        default_factory=list,
        description="List of capability IDs (e.g., web_search, memory) the agent should have.",
    )
    suggested_integrations: list[str] = Field(
        default_factory=list,
        description="List of integration IDs (e.g., discord, slack) the agent could use.",
    )
    goals: list[str]
