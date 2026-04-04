"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.api.errors import raise_api_error
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.schemas import AgentResponse
from app.domain.chat.dtos import (
    AddAgentToRoom,
    ChatMessageResponse,
    ChatRequest,
    MessageUpdate,
    RoomCreate,
    RoomResponse,
    RoomSummaryResponse,
    RoomUpdate,
)
from app.domain.chat.service import ChatService  # noqa: TCH001

router = APIRouter(tags=["Chat"])


@router.get(
    "/rooms",
    response_model=list[RoomResponse],
    summary="List rooms",
    description="List all chat rooms for the current user. Requires authentication.",
    responses={
        200: {"description": "Rooms retrieved successfully."},
        401: {"description": "Authentication required"},
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
    summary="Create room",
    description="Create a new chat room. Requires authentication.",
    responses={
        200: {"description": "Room created successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def create_room(
    data: RoomCreate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    return await service.create_room(data.name, user_id)


@router.get(
    "/rooms/summaries",
    response_model=list[RoomSummaryResponse],
    summary="List room summaries",
    description=(
        "List all chat rooms for the current user with lightweight room metadata, "
        "agent membership, and the latest message preview."
    ),
    responses={
        200: {"description": "Room summaries retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_room_summaries(
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[RoomSummaryResponse]:
    return await service.list_room_summaries(user_id)


@router.post(
    "/chat",
    summary="Chat without a room",
    description="General chat stream without a specified room. Requires authentication.",
    responses={
        200: {"description": "Chat response streamed successfully."},
        400: {"description": "Message or content is required"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
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
        raise_api_error(
            status_code=400,
            error="message_required",
            message="Message or content is required.",
        )
    return StreamingResponse(
        service.stream_responses(message, user_id, accept_language),
        media_type="text/event-stream",
    )


@router.post(
    "/crew",
    summary="Run CrewAI",
    description="Run a full CrewAI orchestration for a single task and return structured output. Requires authentication.",
    responses={
        200: {"description": "Crew run successfully."},
        400: {"description": "Message or content is required"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def run_crew(
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    accept_language: Annotated[
        str | None, Header(pattern=r"^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$")
    ] = None,
) -> dict[str, str]:
    """Run a full CrewAI orchestration for a single task and return structured output."""
    message = request.message or request.content
    if not message:
        raise_api_error(
            status_code=400,
            error="message_required",
            message="Message or content is required.",
        )
    return await service.run_crew(message, user_id, accept_language=accept_language)


@router.patch(
    "/rooms/{room_id}",
    response_model=RoomResponse,
    summary="Update room",
    description="Update a chat room's details. Requires authentication.",
    responses={
        200: {"description": "Room updated successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Room not found"},
        422: {"description": "Validation Error"},
    },
)
async def update_room(
    room_id: UUID,
    data: RoomUpdate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    room = await service.update_room(room_id, data.name, user_id=user_id)
    if not room:
        raise_api_error(status_code=404, error="room_not_found", message="Room not found.")
    return room


@router.delete(
    "/rooms/{room_id}",
    summary="Delete room",
    description="Delete a chat room. Requires authentication.",
    responses={
        200: {"description": "Room deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Room not found"},
        422: {"description": "Validation Error"},
    },
)
async def delete_room(
    room_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.delete_room(room_id, user_id=user_id)
    if not success:
        raise_api_error(status_code=404, error="room_not_found", message="Room not found.")
    return {"status": "ok"}


@router.post(
    "/rooms/{room_id}/agents",
    summary="Add agent to room",
    description="Add an agent to a chat room. Requires authentication.",
    responses={
        200: {"description": "Agent added to room successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def add_agent_to_room(
    room_id: UUID,
    data: AddAgentToRoom,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.add_agent_to_room(room_id, data.agent_id, user_id=user_id)
    if success is None:
        raise_api_error(status_code=404, error="room_not_found", message="Room not found.")
    return {"status": "ok"}


@router.get(
    "/rooms/{room_id}/agents",
    response_model=list[AgentResponse],
    summary="Get room agents",
    description="List all agents in a chat room. Requires authentication.",
    responses={
        200: {"description": "Room agents retrieved successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Chat room not found"},
        422: {"description": "Validation Error"},
    },
)
async def get_room_agents(
    room_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[AgentResponse]:
    agents = await service.list_room_agents(room_id, user_id=user_id)
    if agents is None:
        raise_api_error(status_code=404, error="room_not_found", message="Chat room not found.")
    return [AgentResponse.model_validate(a) for a in agents]


@router.delete(
    "/rooms/{room_id}/agents/{agent_id}",
    summary="Remove agent from room",
    description="Remove an agent from a chat room. Requires authentication.",
    responses={
        200: {"description": "Agent removed from room successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Agent not found in room"},
        422: {"description": "Validation Error"},
    },
)
async def remove_agent_from_room(
    room_id: UUID,
    agent_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.remove_agent_from_room(room_id, agent_id, user_id=user_id)
    if not success:
        raise_api_error(
            status_code=404,
            error="agent_not_in_room",
            message="Agent not found in room.",
        )
    return {"status": "ok"}


@router.get(
    "/rooms/{room_id}/messages",
    response_model=list[ChatMessageResponse],
    summary="List chat messages",
    description="Retrieve all messages in a chat room. Requires authentication.",
    responses={
        200: {"description": "Messages retrieved successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Chat room not found"},
        422: {"description": "Validation Error"},
    },
)
async def get_room_messages(
    room_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    before_id: Annotated[UUID | None, Query()] = None,
) -> list[ChatMessageResponse]:
    messages = await service.get_room_messages(
        room_id, user_id=user_id, limit=limit, before_id=before_id
    )
    if messages is None:
        raise_api_error(status_code=404, error="room_not_found", message="Chat room not found.")
    return messages


@router.patch(
    "/rooms/{room_id}/messages/{message_id}",
    response_model=ChatMessageResponse,
    summary="Update message",
    description="Update a chat message. Requires authentication.",
    responses={
        200: {"description": "Message updated successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Message not found"},
        422: {"description": "Validation Error"},
    },
)
async def update_message(
    room_id: UUID,
    message_id: UUID,
    data: MessageUpdate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> ChatMessageResponse:
    msg = await service.update_message(message_id, data.content, user_id=user_id)
    if not msg:
        raise_api_error(status_code=404, error="message_not_found", message="Message not found.")
    return msg


@router.delete(
    "/rooms/{room_id}/messages/{message_id}",
    summary="Delete message",
    description="Delete a chat message. Requires authentication.",
    responses={
        200: {"description": "Message deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Message not found"},
        422: {"description": "Validation Error"},
    },
)
async def delete_message(
    room_id: UUID,
    message_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.delete_message(message_id, user_id=user_id)
    if not success:
        raise_api_error(status_code=404, error="message_not_found", message="Message not found.")
    return {"status": "ok"}
