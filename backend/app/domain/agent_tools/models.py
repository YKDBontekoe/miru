"""Agent Tool and Skill domain models using Tortoise ORM."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.infrastructure.database.base import SupabaseModel
from tortoise import fields

if TYPE_CHECKING:
    from app.domain.agents.models import Agent


class AgentTool(SupabaseModel):
    """Database entity for Agent Tools/Skills."""

    id = fields.UUIDField(primary_key=True)
    user_id = fields.UUIDField(null=True, db_index=True)
    name = fields.CharField(max_length=100, db_index=True)
    description = fields.TextField()
    category = fields.CharField(max_length=50, default="utility", db_index=True)
    version = fields.CharField(max_length=20, default="1.0.0")
    parameters_schema = fields.JSONField(default={})
    is_public = fields.BooleanField(default=False)
    status = fields.CharField(max_length=20, default="active")

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

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
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "agent_tool_links"
        unique_together = (("agent", "tool"),)
