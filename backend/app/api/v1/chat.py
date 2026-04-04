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
    """
    Retrieve all chat rooms for the authenticated user.

    Args:
        user_id (CurrentUser): The ID of the authenticated user making the request.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        list[RoomResponse]: A list of chat rooms belonging to the user.
    """
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
    """
    Create a new chat room for the authenticated user.

    Args:
        data (RoomCreate): The payload containing the room details (e.g., name).
        user_id (CurrentUser): The ID of the authenticated user creating the room.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        RoomResponse: The newly created chat room.
    """
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
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    """
    Update the details of an existing chat room.

    Args:
        room_id (UUID): The unique identifier of the room to update.
        data (RoomUpdate): The payload containing the updated room details.
        user_id (CurrentUser): The ID of the authenticated user updating the room.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        RoomResponse: The updated chat room.

    Raises:
        HTTPException: If the room is not found or the user is not authorized.
    """
    room = await service.update_room(room_id, data.name, user_id=user_id)
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
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    """
    Delete a chat room.

    Args:
        room_id (UUID): The unique identifier of the room to delete.
        user_id (CurrentUser): The ID of the authenticated user deleting the room.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        dict[str, str]: A status dictionary indicating success.

    Raises:
        HTTPException: If the room is not found or the user is not authorized.
    """
    success = await service.delete_room(room_id, user_id=user_id)
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
    user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    """
    Add an agent to a chat room.

    Args:
        room_id (UUID): The unique identifier of the room.
        data (AddAgentToRoom): The payload containing the ID of the agent to add.
        user_id (CurrentUser): The ID of the authenticated user modifying the room.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        dict[str, str]: A status dictionary indicating success.

    Raises:
        HTTPException: If the room is not found or the user is not authorized.
    """
    success = await service.add_agent_to_room(room_id, data.agent_id, user_id=user_id)
    if success is None:
        raise HTTPException(status_code=404, detail="Room not found")
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
    """
    Retrieve all agents associated with a chat room.

    Args:
        room_id (UUID): The unique identifier of the room.
        user_id (CurrentUser): The ID of the authenticated user requesting the agents.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        list[AgentResponse]: A list of agents participating in the room.

    Raises:
        HTTPException: If the room is not found or the user is not authorized.
    """
    agents = await service.list_room_agents(room_id, user_id=user_id)
    if agents is None:
        raise HTTPException(status_code=404, detail="Chat room not found")
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
    """
    Remove an agent from a chat room.

    Args:
        room_id (UUID): The unique identifier of the room.
        agent_id (UUID): The unique identifier of the agent to remove.
        user_id (CurrentUser): The ID of the authenticated user modifying the room.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        dict[str, str]: A status dictionary indicating success.

    Raises:
        HTTPException: If the agent is not found in the room or the user is not authorized.
    """
    success = await service.remove_agent_from_room(room_id, agent_id, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail={"message": "Agent not found in room", "error": "AGENT_NOT_IN_ROOM"},
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
    """
    Retrieve messages from a chat room, ordered by creation time.

    Args:
        room_id (UUID): The unique identifier of the room.
        user_id (CurrentUser): The ID of the authenticated user requesting messages.
        service (ChatService): The injected chat service containing business logic.
        limit (int, optional): The maximum number of messages to return. Defaults to 50.
        before_id (UUID | None, optional): A message ID used as a cursor for pagination. Defaults to None.

    Returns:
        list[ChatMessageResponse]: A list of chat messages.

    Raises:
        HTTPException: If the room is not found or the user is not authorized.
    """
    messages = await service.get_room_messages(
        room_id, user_id=user_id, limit=limit, before_id=before_id
    )
    if messages is None:
        raise HTTPException(status_code=404, detail="Chat room not found")
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
    """
    Update the content of an existing chat message.

    Args:
        room_id (UUID): The unique identifier of the room.
        message_id (UUID): The unique identifier of the message to update.
        data (MessageUpdate): The payload containing the updated message content.
        user_id (CurrentUser): The ID of the authenticated user updating the message.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        ChatMessageResponse: The updated chat message.

    Raises:
        HTTPException: If the message is not found or the user is not authorized.
    """
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
    """
    Delete a chat message.

    Args:
        room_id (UUID): The unique identifier of the room.
        message_id (UUID): The unique identifier of the message to delete.
        user_id (CurrentUser): The ID of the authenticated user deleting the message.
        service (ChatService): The injected chat service containing business logic.

    Returns:
        dict[str, str]: A status dictionary indicating success.

    Raises:
        HTTPException: If the message is not found or the user is not authorized.
    """
    success = await service.delete_message(message_id, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail={"message": "Message not found", "error": "MESSAGE_NOT_FOUND"},
        )
    return {"status": "ok"}
