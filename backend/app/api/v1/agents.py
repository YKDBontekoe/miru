"""Agent API router v1."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_agent_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.models import (
    Agent,
    AgentCreate,
    AgentGenerate,
    AgentGenerationResponse,
    AgentResponse,
)
from app.domain.agents.service import AgentService  # noqa: TCH001

router = APIRouter(tags=["Agents"])


@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> Agent:
    """Create a new agent."""
    return await service.create_agent(agent_data, user_id)


@router.get("/", response_model=list[AgentResponse])
async def list_agents(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[Agent]:
    """List all agents for the current user."""
    return await service.list_agents(user_id)


@router.post("/generate", response_model=AgentGenerationResponse)
async def generate_agent(
    data: AgentGenerate,
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentGenerationResponse:
    """Use AI to generate an agent persona."""
    return await service.generate_agent_profile(data.keywords)
