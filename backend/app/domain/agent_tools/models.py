"""Agent Tool and Skill domain models using Tortoise ORM."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from tortoise import fields

from app.infrastructure.database.base import SupabaseModel

if TYPE_CHECKING:
    from app.domain.agents.models import Agent


class AgentTool(SupabaseModel):
    """Database entity for Agent Tools/Skills."""

    id: UUID = fields.UUIDField(primary_key=True)
    user_id: UUID | None = fields.UUIDField(null=True, db_index=True)
    name: str = fields.CharField(max_length=100, db_index=True)  # type: ignore[assignment]
    description: str = fields.TextField()
    category: str = fields.CharField(max_length=50, default="utility", db_index=True)  # type: ignore[assignment]
    version: str = fields.CharField(max_length=20, default="1.0.0")  # type: ignore[assignment]
    parameters_schema: dict = fields.JSONField(default={})
    is_public: bool = fields.BooleanField(default=False)  # type: ignore[assignment]
    status: str = fields.CharField(max_length=20, default="active")  # type: ignore[assignment]

    created_at: datetime = fields.DatetimeField(auto_now_add=True)
    updated_at: datetime = fields.DatetimeField(auto_now=True)
    deleted_at: datetime | None = fields.DatetimeField(null=True)

    class Meta:
        table = "agent_tools"
        sql_policies = [
            "ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY agent_tools_select ON public.agent_tools FOR SELECT USING (is_public = true OR auth.uid() = user_id OR user_id IS NULL);",
            "CREATE POLICY agent_tools_insert ON public.agent_tools FOR INSERT WITH CHECK (auth.uid() = user_id);",
            "CREATE POLICY agent_tools_update ON public.agent_tools FOR UPDATE USING (auth.uid() = user_id);",
            "CREATE POLICY agent_tools_delete ON public.agent_tools FOR DELETE USING (auth.uid() = user_id);",
        ]


class AgentToolLink(SupabaseModel):
    """Junction table for Agents and their assigned Tools."""

    agent: fields.ForeignKeyRelation[Agent] = fields.ForeignKeyField(
        "models.Agent", related_name="tool_links", on_delete=fields.CASCADE
    )
    tool: fields.ForeignKeyRelation[AgentTool] = fields.ForeignKeyField(
        "models.AgentTool", related_name="agent_links", on_delete=fields.CASCADE
    )
    created_at: datetime = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "agent_tool_links"
        unique_together = (("agent", "tool"),)
