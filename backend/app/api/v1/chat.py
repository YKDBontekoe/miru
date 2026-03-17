"""Chat API router v1."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID  # noqa: TCH003

from fastapi import APIRouter, Depends, HTTPException, Request, Response
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
    SignalRNegotiateResponse,
)
from app.domain.chat.service import ChatService  # noqa: TCH001
from app.domain.chat.signalr import get_webpubsub_client

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
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> RoomResponse:
    room = await service.update_room(room_id, data.name)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


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


@router.post("/rooms/{room_id}/agents")
async def add_agent_to_room(
    room_id: UUID,
    data: AddAgentToRoom,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> dict[str, str]:
    await service.add_agent_to_room(room_id, data.agent_id)
    return {"status": "ok"}


@router.get("/rooms/{room_id}/agents", response_model=list[AgentResponse])
async def get_room_agents(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[AgentResponse]:
    agents = await service.list_room_agents(room_id)
    return [AgentResponse.model_validate(a) for a in agents]


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageResponse])
async def get_room_messages(
    room_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> list[ChatMessageResponse]:
    return await service.get_room_messages(room_id)


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


@router.post("/negotiate", response_model=SignalRNegotiateResponse)
async def negotiate(
    user_id: CurrentUser,
) -> SignalRNegotiateResponse:
    """Negotiate endpoint for Azure Web PubSub SignalR."""
    client = get_webpubsub_client()
    if not client:
        raise HTTPException(status_code=500, detail="Azure Web PubSub not configured")

    # Issue a token for the user
    token = client.get_client_access_token(user_id=str(user_id))
    return SignalRNegotiateResponse(url=token["url"], access_token=token["token"])


@router.options("/webhook")
async def webpubsub_options(request: Request) -> Response:
    """Respond to Web PubSub Abuse Protection."""
    if "webhook-request-origin" in request.headers:
        return Response(
            headers={"WebHook-Allowed-Origin": request.headers["webhook-request-origin"]}
        )
    return Response(status_code=400)


@router.post("/webhook")
async def webpubsub_webhook(
    request: Request,
    service: Annotated[ChatService, Depends(get_chat_service)],
) -> Response:
    """Handle messages sent from SignalR clients."""
    payload = await request.json()

    # We expect messages from clients. User ID is attached by Web PubSub in headers.
    user_id_str = request.headers.get("ce-userid")
    event_type = request.headers.get("ce-type")

    if not user_id_str or event_type != "azure.webpubsub.user.message":
        return Response(status_code=200)  # ACK gracefully

    try:
        user_id = UUID(user_id_str)
    except Exception:
        return Response(status_code=400)

    message_content = ""
    # With SignalR, messages are wrapped in multiple levels, or we can just parse the direct string
    # Try parsing text data
    try:
        # Check if SignalR invocation
        if (
            "arguments" in payload
            and isinstance(payload["arguments"], list)
            and len(payload["arguments"]) > 0
        ):
            message_content = payload["arguments"][0]
        else:
            return Response(status_code=200)  # Unknown payload
    except Exception:
        return Response(status_code=400)

    # Trigger chat processing
    # Since it's a websocket and we want to respond asynchronously without blocking Web PubSub webhook:
    import asyncio

    # Check if room id is provided via headers or we do general stream responses
    # By default, we'll run general chat if we don't know the room
    # The frontend right now doesn't pass room_id to SignalR `sendMessage`
    # Let's just consume the stream to generate the final response

    async def process_chat() -> None:
        try:
            # Consume stream to trigger the final broadcast inside service
            async for _ in service.stream_responses(message_content, user_id):
                pass
        except Exception as e:
            import logging

            logging.getLogger(__name__).error(f"Error processing SignalR chat: {e}")

    asyncio.create_task(process_chat())

    return Response(status_code=200)
