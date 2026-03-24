"""Agent API router v1."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_agent_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.models import (
    AgentCreate,
    AgentGenerate,
    AgentGenerationResponse,
    AgentResponse,
    Capability,
    CapabilityResponse,
    Integration,
    IntegrationResponse,
)
from app.domain.agents.service import AgentService  # noqa: TCH001

router = APIRouter(tags=["Agents"])


# DOCS(miru-agent): undocumented endpoint
@router.post("", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentResponse:
    """Create a new agent."""
    return await service.create_agent(agent_data, user_id)


# DOCS(miru-agent): undocumented endpoint
@router.get("", response_model=list[AgentResponse])
async def list_agents(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[AgentResponse]:
    """List all agents for the current user."""
    return await service.list_agents(user_id)


# DOCS(miru-agent): undocumented endpoint
@router.get("/capabilities", response_model=list[CapabilityResponse])
async def list_capabilities(
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[Capability]:
    """List all available capabilities."""
    return await service.list_capabilities()


# DOCS(miru-agent): undocumented endpoint
@router.get("/integrations", response_model=list[IntegrationResponse])
async def list_integrations(
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[Integration]:
    """List all available integrations."""
    return await service.list_integrations()


# DOCS(miru-agent): undocumented endpoint
@router.post("/generate", response_model=AgentGenerationResponse)
async def generate_agent(
    data: AgentGenerate,
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentGenerationResponse:
    """Use AI to generate an agent persona."""
    return await service.generate_agent_profile(data.keywords)
