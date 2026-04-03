"""Agent API router v1."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_agent_service
from app.api.errors import raise_api_error
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.models import Capability, Integration
from app.domain.agents.schemas import (
    AgentCreate,
    AgentGenerate,
    AgentGenerationResponse,
    AgentResponse,
    AgentTemplateResponse,
    AgentUpdate,
    CapabilityResponse,
    IntegrationResponse,
)
from app.domain.agents.service import AgentService  # noqa: TCH001

router = APIRouter(tags=["Agents"])


@router.post(
    "",
    response_model=AgentResponse,
    summary="Create agent",
    description="Create a new AI agent. Requires authentication.",
    responses={
        200: {"description": "Agent created successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def create_agent(
    agent_data: AgentCreate,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentResponse:
    """Create a new agent."""
    return await service.create_agent(agent_data, user_id)


@router.get(
    "",
    response_model=list[AgentResponse],
    summary="List agents",
    description="Retrieve all available AI agents. Requires authentication.",
    responses={
        200: {"description": "Agents retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_agents(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[AgentResponse]:
    """List all agents for the current user."""
    return await service.list_agents(user_id)


@router.get(
    "/capabilities",
    response_model=list[CapabilityResponse],
    summary="List capabilities",
    description="List all available capabilities. Requires authentication.",
    responses={
        200: {"description": "Capabilities retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_capabilities(
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[Capability]:
    """List all available capabilities."""
    return await service.list_capabilities()


@router.get(
    "/integrations",
    response_model=list[IntegrationResponse],
    summary="List integrations",
    description="List all available integrations. Requires authentication.",
    responses={
        200: {"description": "Integrations retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_integrations(
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[Integration]:
    """List all available integrations."""
    return await service.list_integrations()


@router.get(
    "/templates",
    response_model=list[AgentTemplateResponse],
    summary="List templates",
    description="List available persona templates (paginated). Requires authentication.",
    responses={
        200: {"description": "Templates retrieved successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def list_templates(
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[AgentTemplateResponse]:
    """List available persona templates (paginated)."""
    return await service.list_templates(skip=skip, limit=limit)


@router.post(
    "/generate",
    response_model=AgentGenerationResponse,
    summary="Generate agent persona",
    description="Use AI to generate an agent persona from keywords.",
    responses={
        200: {"description": "Agent persona generated successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def generate_agent(
    data: AgentGenerate,
    _user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentGenerationResponse:
    """Use AI to generate an agent persona."""
    return await service.generate_agent_profile(data.keywords)


@router.patch(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Update agent",
    description="Update an existing agent.",
    responses={
        200: {"description": "Agent updated successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Agent not found"},
        422: {"description": "Validation Error"},
    },
)
async def update_agent(
    agent_id: UUID,
    data: AgentUpdate,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentResponse:
    """Update an existing agent."""
    result = await service.update_agent(agent_id, user_id, data)
    if not result:
        raise_api_error(status_code=404, error="agent_not_found", message="Agent not found.")
    return result


@router.delete(
    "/{agent_id}",
    summary="Delete agent",
    description="Delete an agent.",
    responses={
        200: {
            "description": "Agent deleted successfully.",
            "content": {"application/json": {"example": {"status": "ok"}}},
        },
        401: {"description": "Authentication required"},
        404: {
            "description": "Agent not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {"message": "Agent not found", "error": "AGENT_NOT_FOUND"}
                    }
                }
            },
        },
        422: {"description": "Validation Error"},
    },
)
async def delete_agent(
    agent_id: UUID,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> dict[str, str]:
    """Delete an agent."""
    success = await service.delete_agent(agent_id, user_id)
    if not success:
        raise_api_error(status_code=404, error="agent_not_found", message="Agent not found.")
    return {"status": "ok"}
