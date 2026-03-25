"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.models import AgentResponse
from app.domain.chat.dtos import (
    AddAgentToRoom,
    ChatMessageResponse,
    ChatRequest,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from app.domain.chat.service import ChatService  # noqa: TCH001

router = APIRouter(tags=["Chat"])


@router.get(
    "/rooms",
    response_model=list[RoomResponse],
    responses={
        200: {"description": "Successfully retrieved list of rooms"},
    },
)
async def list_rooms(
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[RoomResponse]:
    return await service.list_rooms(user_id)


@router.post(
    "/rooms",
    response_model=RoomResponse,
    responses={
        200: {"description": "Successfully created a room"},
    },
)
async def create_room(
    data: RoomCreate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    return await service.create_room(data.name, user_id)


@router.post(
    "/chat",
    responses={
        200: {"description": "Successfully streamed chat response"},
        400: {"description": "Message or content is required"},
    },
)
async def chat(
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    accept_language: Annotated[
        str | None, Header(pattern=r"^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$")
    ] = None,
) -> StreamingResponse:
    """General chat stream without a specified room."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
    return StreamingResponse(
        service.stream_responses(message, user_id, accept_language),
        media_type="text/event-stream",
    )


@router.post(
    "/crew",
    responses={
        200: {"description": "Successfully executed crew orchestration"},
        400: {"description": "Message or content is required"},
    },
)
async def run_crew(
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    accept_language: Annotated[
        str | None, Header(pattern=r"^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$")
    ] = None,
) -> dict[str, Any]:
    """Run a full CrewAI orchestration for a single task and return structured output."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
    return await service.run_crew(message, user_id, accept_language=accept_language)


@router.patch(
    "/rooms/{room_id}",
    response_model=RoomResponse,
    responses={
        200: {"description": "Successfully updated room"},
        404: {"description": "Room not found"},
    },
)
async def update_room(
    room_id: UUID,
    data: RoomUpdate,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    room = await service.update_room(room_id, data.name)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.delete(
    "/rooms/{room_id}",
    response_model=dict[str, str],
    responses={
        200: {"description": "Successfully deleted room"},
        404: {"description": "Room not found"},
    },
)
async def delete_room(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.delete_room(room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"status": "ok"}


@router.post(
    "/rooms/{room_id}/agents",
    response_model=dict[str, str],
    responses={
        200: {"description": "Successfully added agent to room"},
    },
)
async def add_agent_to_room(
    room_id: UUID,
    data: AddAgentToRoom,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    await service.add_agent_to_room(room_id, data.agent_id)
    return {"status": "ok"}


@router.get(
    "/rooms/{room_id}/agents",
    response_model=list[AgentResponse],
    responses={
        200: {"description": "Successfully retrieved agents in room"},
    },
)
async def get_room_agents(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[AgentResponse]:
    agents = await service.list_room_agents(room_id)
    return [AgentResponse.model_validate(a) for a in agents]


@router.delete(
    "/rooms/{room_id}/agents/{agent_id}",
    response_model=dict[str, str],
    responses={
        200: {"description": "Successfully removed agent from room"},
        404: {"description": "Agent not found in room"},
    },
)
async def remove_agent_from_room(
    room_id: UUID,
    agent_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.remove_agent_from_room(room_id, agent_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail={"message": "Agent not found in room", "error": "AGENT_NOT_IN_ROOM"},
        )
    return {"status": "ok"}


@router.get(
    "/rooms/{room_id}/messages",
    response_model=list[ChatMessageResponse],
    responses={
        200: {"description": "Successfully retrieved messages in room"},
    },
)
async def get_room_messages(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[ChatMessageResponse]:
    return await service.get_room_messages(room_id)


@router.post(
    "/rooms/{room_id}/chat",
    responses={
        200: {"description": "Successfully streamed chat response from room"},
        400: {"description": "Message or content is required"},
    },
)
async def chat_in_room(
    room_id: UUID,
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    accept_language: Annotated[
        str | None, Header(pattern=r"^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$")
    ] = None,
) -> StreamingResponse:
    """Stream responses from agents in the room."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
    return StreamingResponse(
        service.stream_room_responses(room_id, message, user_id, accept_language),
        media_type="text/event-stream",
    )
