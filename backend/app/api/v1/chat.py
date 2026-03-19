"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.agents.models import AgentResponse
from app.domain.chat.models import (
    AddAgentToRoom,
    ChatMessageResponse,
    ChatRequest,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from app.domain.chat.service import ChatService  # noqa: TCH001

router = APIRouter(tags=["Chat"])


@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms(
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[RoomResponse]:
    return await service.list_rooms(user_id)


@router.post("/rooms", response_model=RoomResponse)
async def create_room(
    data: RoomCreate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    return await service.create_room(data.name, user_id)


@router.post("/chat")
async def chat(
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> StreamingResponse:
    """General chat stream without a specified room."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
    return StreamingResponse(
        service.stream_responses(message, user_id),
        media_type="text/event-stream",
    )


@router.post("/crew")
async def run_crew(
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, Any]:
    """Run a full CrewAI orchestration for a single task and return structured output."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
    return await service.run_crew(message, user_id)


@router.patch("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: UUID,
    data: RoomUpdate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    room = await service.update_room(room_id, data.name, user_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    success = await service.delete_room(room_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"status": "ok"}


@router.post("/rooms/{room_id}/agents")
async def add_agent_to_room(
    room_id: UUID,
    data: AddAgentToRoom,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    try:
        await service.add_agent_to_room(room_id, data.agent_id, user_id)
        return {"status": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/rooms/{room_id}/agents", response_model=list[AgentResponse])
async def get_room_agents(
    room_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[AgentResponse]:
    try:
        agents = await service.list_room_agents(room_id, user_id)
        return [AgentResponse.model_validate(a) for a in agents]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageResponse])
async def get_room_messages(
    room_id: UUID,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[ChatMessageResponse]:
    try:
        return await service.get_room_messages(room_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/rooms/{room_id}/chat")
async def chat_in_room(
    room_id: UUID,
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> StreamingResponse:
    """Stream responses from agents in the room."""
    message = request.message or request.content
    if not message:
        raise HTTPException(status_code=400, detail="Message or content is required")
    return StreamingResponse(
        service.stream_room_responses(room_id, message, user_id),
        media_type="text/event-stream",
    )
