"""Agent API router v1."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_agent_service
from app.api.errors import raise_api_error
from app.core.security.auth import CurrentUser  # noqa: TCH001
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
logger = logging.getLogger(__name__)


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
    try:
        return await service.create_agent(agent_data, user_id)
    except LookupError as e:
        logger.error("Failed to create agent: %s", str(e))
        raise_api_error(
            status_code=500,
            error="agent_creation_failed",
            message="Failed to fully construct agent on creation.",
        )


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
    """List agents for the current user."""
    return await service.list_agents(user_id)


@router.get(
    "/capabilities",
    response_model=list[CapabilityResponse],
    summary="List capabilities",
    description="List all available agent capabilities.",
    responses={
        200: {"description": "Capabilities retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_capabilities(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[CapabilityResponse]:
    """List available capabilities."""
    caps = await service.list_capabilities()
    return [
        CapabilityResponse(
            id=cap.id,
            name=cap.name,
            description=cap.description,
            icon=cap.icon,
        )
        for cap in caps
    ]


@router.get(
    "/integrations",
    response_model=list[IntegrationResponse],
    summary="List integrations",
    description="List all available external service integrations.",
    responses={
        200: {"description": "Integrations retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_integrations(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> list[IntegrationResponse]:
    """List available integrations."""
    integrations = await service.list_integrations()
    return [
        IntegrationResponse(
            id=i.id,
            display_name=i.display_name,
            description=i.description,
            icon=i.icon,
            config_schema=i.config_schema,
        )
        for i in integrations
    ]


@router.get(
    "/templates",
    response_model=list[AgentTemplateResponse],
    summary="List templates",
    description="List available pre-made persona templates.",
    responses={
        200: {"description": "Templates retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_templates(
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
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
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentGenerationResponse:
    """Generate agent details from a keyword prompt."""
    return await service.generate_agent_profile(data.keywords)


@router.patch(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Update agent",
    description="Update an existing agent's configuration.",
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
    try:
        result = await service.update_agent(agent_id, user_id, data)
        if not result:
            raise_api_error(status_code=404, error="agent_not_found", message="Agent not found.")
        return result
    except LookupError as e:
        logger.error("Failed to fetch agent after update: %s", str(e))
        raise_api_error(
            status_code=500,
            error="agent_update_failed",
            message="Agent updated but failed to refetch fully.",
        )


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
        404: {"description": "Agent not found"},
    },
)
async def delete_agent(
    agent_id: UUID,
    user_id: CurrentUser,
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> dict[str, str]:
    """Delete an existing agent."""
    deleted = await service.delete_agent(agent_id, user_id)
    if not deleted:
        raise_api_error(status_code=404, error="agent_not_found", message="Agent not found.")
    return {"status": "ok"}
