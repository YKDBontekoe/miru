"""Agent API router v1."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.domain.agents.models import (
    AgentCreate,
    AgentGenerate,
    AgentGenerationResponse,
    AgentResponse,
    CapabilityInfo,
    IntegrationInfo,
)
from app.domain.agents.service import AgentService
from app.api.dependencies import get_agent_service
from app.infrastructure.database.supabase import get_supabase
from app.app_auth import CurrentUser # Assume moved or updated path

router = APIRouter(tags=["Agents"])

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)]
):
    """Create a new agent."""
    return await service.create_agent(agent_data, user_id)

@router.get("/", response_model=list[AgentResponse])
async def list_agents(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)]
):
    """List all agents for the current user."""
    return await service.list_agents(user_id)

# ... (Other endpoints: generate, available-capabilities, etc.)
