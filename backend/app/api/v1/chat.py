"""Chat API router v1."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.domain.chat.models import ChatRequest, RoomCreate, RoomResponse

if TYPE_CHECKING:
    from app.core.security.auth import CurrentUser
    from app.domain.chat.service import ChatService

router = APIRouter(tags=["Chat"])

@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms(
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)]
):
    return await service.list_rooms(user_id)

@router.post("/rooms", response_model=RoomResponse)
async def create_room(
    data: RoomCreate,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)]
):
    return await service.create_room(data.name, user_id)

@router.post("/rooms/{room_id}/chat")
async def chat_in_room(
    room_id: str,
    request: ChatRequest,
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)]
):
    """Stream responses from agents in the room."""
    return StreamingResponse(
        service.stream_room_responses(room_id, request.message, user_id),
        media_type="text/event-stream"
    )
