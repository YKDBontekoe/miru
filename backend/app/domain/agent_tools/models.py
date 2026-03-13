"""Agent Tool and Skill domain models using Tortoise ORM."""

from tortoise import fields

from app.infrastructure.database.base import SupabaseModel


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
            "CREATE POLICY agent_tools_owner_all ON public.agent_tools FOR ALL USING ("
            "user_id IS NULL OR auth.uid() = user_id OR is_public = true"
            ");",
        ]


class AgentToolLink(SupabaseModel):
    """Junction table for Agents and their assigned Tools."""

    agent = fields.ForeignKeyField(
        "models.Agent", related_name="tool_links", on_delete=fields.CASCADE
    )
    tool = fields.ForeignKeyField(
        "models.AgentTool", related_name="agent_links", on_delete=fields.CASCADE
    )
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "agent_tool_links"
        unique_together = (("agent", "tool"),)
