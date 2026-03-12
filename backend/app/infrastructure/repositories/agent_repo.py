"""Agent repository for Supabase operations."""

from __future__ import annotations

import json
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.domain.agents.models import AgentCreate, AgentResponse


class AgentRepository:
    def __init__(self, db: Client):
        self.db = db

    def _agent_from_row(self, data: dict[str, Any]) -> AgentResponse:
        """Convert a database row to an AgentResponse, handling JSONB fields."""
        goals = data.get("goals", [])
        if isinstance(goals, str):
            goals = json.loads(goals)

        capabilities = data.get("capabilities", [])
        if isinstance(capabilities, str):
            capabilities = json.loads(capabilities)

        integrations = data.get("integrations", [])
        if isinstance(integrations, str):
            integrations = json.loads(integrations)

        return AgentResponse(
            id=str(data["id"]),
            name=data["name"],
            personality=data["personality"],
            description=data.get("description"),
            goals=goals if goals else [],
            capabilities=capabilities if capabilities else [],
            integrations=integrations if integrations else [],
            system_prompt=data.get("system_prompt"),
            status=data.get("status", "active"),
            mood=data.get("mood", "Neutral"),
            message_count=data.get("message_count", 0),
            created_at=str(data["created_at"]),
            avatar_url=data.get("avatar_url"),
        )

    async def get_by_id(self, agent_id: str) -> AgentResponse | None:
        """Fetch a single agent by ID."""
        response = self.db.table("agents").select("*").eq("id", agent_id).execute()
        if not response.data:
            return None
        return self._agent_from_row(response.data[0])

    async def list_by_user(self, user_id: UUID | str) -> list[AgentResponse]:
        """List all agents for a user."""
        response = self.db.table("agents").select("*").eq("user_id", str(user_id)).execute()
        return [self._agent_from_row(record) for record in cast("list[dict[str, Any]]", response.data)]

    async def create(self, agent_data: dict[str, Any]) -> AgentResponse:
        """Create a new agent."""
        response = self.db.table("agents").insert(agent_data).execute()
        data = cast("list[dict[str, Any]]", response.data)[0]
        return self._agent_from_row(data)

    async def update_mood(self, agent_id: str, mood: str) -> None:
        """Update an agent's mood."""
        self.db.table("agents").update({"mood": mood}).eq("id", agent_id).execute()

    async def increment_message_count(self, agent_id: str, new_count: int) -> None:
        """Increment an agent's message count."""
        self.db.table("agents").update({"message_count": new_count}).eq("id", agent_id).execute()

    async def get_relationships(self, agent_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch relationships between a set of agents."""
        if len(agent_ids) < 2:
            return []
        response = (
            self.db.table("agent_relationships")
            .select("*")
            .in_("agent_id", agent_ids)
            .in_("target_agent_id", agent_ids)
            .execute()
        )
        return cast("list[dict[str, Any]]", response.data)
