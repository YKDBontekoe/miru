"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.models import AgentResponse
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


# DOCS(miru-agent): undocumented endpoint
@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms(
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[RoomResponse]:
    return await service.list_rooms(user_id)


# DOCS(miru-agent): undocumented endpoint
@router.post("/rooms", response_model=RoomResponse)
async def create_room(
    data: RoomCreate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    return await service.create_room(data.name, user_id)


# DOCS(miru-agent): undocumented endpoint
@router.post("/chat")
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


# DOCS(miru-agent): undocumented endpoint
@router.post("/crew")
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


# DOCS(miru-agent): undocumented endpoint
@router.patch("/rooms/{room_id}", response_model=RoomResponse)
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


# DOCS(miru-agent): undocumented endpoint
@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.delete_room(room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"status": "ok"}


# DOCS(miru-agent): undocumented endpoint
@router.post("/rooms/{room_id}/agents")
async def add_agent_to_room(
    room_id: UUID,
    data: AddAgentToRoom,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    await service.add_agent_to_room(room_id, data.agent_id)
    return {"status": "ok"}


# DOCS(miru-agent): undocumented endpoint
@router.get("/rooms/{room_id}/agents", response_model=list[AgentResponse])
async def get_room_agents(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[AgentResponse]:
    agents = await service.list_room_agents(room_id)
    return [AgentResponse.model_validate(a) for a in agents]


# DOCS(miru-agent): undocumented endpoint
@router.delete("/rooms/{room_id}/agents/{agent_id}")
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


# DOCS(miru-agent): undocumented endpoint
@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageResponse])
async def get_room_messages(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    before_id: Annotated[UUID | None, Query()] = None,
) -> list[ChatMessageResponse]:
    return await service.get_room_messages(room_id, limit=limit, before_id=before_id)


# DOCS(miru-agent): undocumented endpoint
@router.patch("/rooms/{room_id}/messages/{message_id}", response_model=ChatMessageResponse)
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


# DOCS(miru-agent): undocumented endpoint
@router.delete("/rooms/{room_id}/messages/{message_id}")
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
