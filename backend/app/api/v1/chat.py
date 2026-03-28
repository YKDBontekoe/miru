"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.schemas import AgentResponse
from app.domain.chat.dtos import (
    AddAgentToRoom,
    ChatMessageResponse,
    ChatRequest,
    MessageUpdate,
    RoomCreate,
    RoomResponse,
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
        raise HTTPException(status_code=400, detail="Message or content is required")
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
) -> dict[str, Any]:
    """Run a full CrewAI orchestration for a single task and return structured output."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
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
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    room = await service.update_room(room_id, data.name)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
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
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.delete_room(room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found")
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
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    await service.add_agent_to_room(room_id, data.agent_id)
    return {"status": "ok"}


@router.get(
    "/rooms/{room_id}/agents",
    response_model=list[AgentResponse],
    summary="Get room agents",
    description="List all agents in a chat room. Requires authentication.",
    responses={
        200: {"description": "Room agents retrieved successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
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
    "/rooms/{room_id}/agent-logs",
    summary="Get agent action logs for a room",
    description="Retrieve the delegation/thinking trace for a chat room. Requires authentication.",
    responses={
        200: {"description": "Action logs retrieved."},
        401: {"description": "Authentication required"},
    },
)
async def get_room_agent_logs(
    room_id: UUID,
    user_id: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
) -> list[dict]:
    """Return the AgentActionLog entries for the given room, most recent first."""
    from app.domain.agents.models import AgentActionLog  # noqa: PLC0415

    logs = (
        await AgentActionLog.filter(room_id=room_id, user_id=user_id)
        .order_by("-created_at")
        .limit(limit)
    )
    return [
        {
            "id": str(log.id),
            "agent_id": str(log.agent_id),  # type: ignore[attr-defined]
            "room_id": str(log.room_id),  # type: ignore[attr-defined]
            "action_type": log.action_type,
            "content": log.content,
            "meta": log.meta,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


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
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    before_id: Annotated[UUID | None, Query()] = None,
) -> list[ChatMessageResponse]:
    return await service.get_room_messages(room_id, limit=limit, before_id=before_id)


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
        raise HTTPException(
            status_code=404,
            detail={"message": "Message not found", "error": "MESSAGE_NOT_FOUND"},
        )
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
        raise HTTPException(
            status_code=404,
            detail={"message": "Message not found", "error": "MESSAGE_NOT_FOUND"},
        )
    return {"status": "ok"}
