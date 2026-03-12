"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.chat.models import ChatRequest, RoomCreate, RoomResponse
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


@router.post("/rooms/{room_id}/chat")
async def chat_in_room(
    room_id: UUID,
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> StreamingResponse:
    """Stream responses from agents in the room."""
    return StreamingResponse(
        service.stream_room_responses(room_id, request.message, user_id),
        media_type="text/event-stream",
    )
