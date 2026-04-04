"""WebSocket chat hub endpoint — SignalR-compatible real-time messaging.

Clients connect to ``/api/v1/ws/chat?token=<jwt>`` and exchange JSON
frames that mirror the SignalR hub-method pattern.

Client → Server frame shapes
-----------------------------
``{"type": "ping"}``
``{"type": "join_room",  "room_id": "<uuid>"}``
``{"type": "leave_room", "room_id": "<uuid>"}``
``{"type": "send_message", "room_id": "<uuid>", "content": "<text>", "clientTempId": "<str>"}``

Server → Client frame shapes
-----------------------------
``{"type": "connected",      "user_id": "<uuid>"}``
``{"type": "pong"}``
``{"type": "joined_room",    "room_id": "<uuid>"}``
``{"type": "message",        "data": {ChatMessage fields}}``
``{"type": "agent_activity", "data": {room_id, agent_names, activity, detail}}``
``{"type": "error",          "action": "<action>", "data": {"message": "<text>"}}``
"""

from __future__ import annotations

import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.api.dependencies import get_auth_service, get_chat_service
from app.domain.auth.service import AuthService
from app.domain.chat.service import ChatService
from app.infrastructure.websocket.manager import chat_hub

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Message handler
# ---------------------------------------------------------------------------


async def _handle_send_message(
    service: ChatService,
    user_id: UUID,
    room_id: UUID,
    content: str,
    client_temp_id: str | None,
    accept_language: str | None = None,
) -> None:
    """Process a user message and push results via the hub."""
    try:
        await service.run_room_chat_ws(
            room_id=room_id,
            user_message=content,
            user_id=user_id,
            client_temp_id=client_temp_id,
            accept_language=accept_language,
        )
    except Exception:
        logger.exception("WS message processing failed  room=%s  user=%s", room_id, user_id)
        await chat_hub.send_to_user(
            user_id,
            {
                "type": "error",
                "data": {
                    "message": "Failed to process message. Please retry.",
                    "room_id": str(room_id),
                },
            },
        )


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------
@router.websocket("/ws/chat")
async def websocket_chat_hub(
    websocket: WebSocket,
    token: str = Query(..., description="Supabase JWT access token"),
    lang: str | None = Query(
        None, description="Preferred language", pattern=r"^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$"
    ),
    auth_service: AuthService = Depends(get_auth_service),
    chat_service: ChatService = Depends(get_chat_service),
) -> None:
    """
    Main WebSocket endpoint — acts as a SignalR hub for chat rooms.

    Connect to `/api/v1/ws/chat?token=<jwt>` to establish a real-time messaging connection.
    This endpoint allows clients to join/leave rooms and send messages within those rooms.
    Authentication is required via a Supabase JWT passed as a query parameter.
    """
    try:
        payload = await auth_service.decode_jwt(token)
        user_id = payload.sub
    except Exception:
        logger.warning("WS auth rejected: invalid token")
        user_id = None

    try:
        if user_id is None:
            await websocket.close(code=4001, reason="Unauthorized")
            return

        await chat_hub.connect(websocket, user_id)
        await chat_hub.send_to_user(user_id, {"type": "connected", "user_id": str(user_id)})

        while True:
            raw = await websocket.receive_text()

            try:
                msg: dict = json.loads(raw)
            except json.JSONDecodeError:
                await chat_hub.send_to_user(
                    user_id, {"type": "error", "data": {"message": "Invalid JSON"}}
                )
                continue

            msg_type = msg.get("type")

            if msg_type == "ping":
                await chat_hub.send_to_user(user_id, {"type": "pong"})

            elif msg_type == "join_room":
                try:
                    room_id = UUID(msg["room_id"])
                except (KeyError, ValueError):
                    await chat_hub.send_to_user(
                        user_id,
                        {
                            "type": "error",
                            "action": "join_room",
                            "data": {
                                "message": "invalid room_id",
                                "room_id": msg.get("room_id"),
                            },
                        },
                    )
                    continue
                chat_hub.join_room(user_id, room_id)
                await chat_hub.send_to_user(
                    user_id, {"type": "joined_room", "room_id": str(room_id)}
                )

            elif msg_type == "leave_room":
                try:
                    room_id = UUID(msg["room_id"])
                except (KeyError, ValueError):
                    await chat_hub.send_to_user(
                        user_id,
                        {
                            "type": "error",
                            "action": "leave_room",
                            "data": {
                                "message": "invalid room_id",
                                "room_id": msg.get("room_id"),
                            },
                        },
                    )
                    continue
                chat_hub.leave_room(user_id, room_id)

            elif msg_type == "send_message":
                try:
                    room_id = UUID(msg["room_id"])
                    content = str(msg.get("content", "")).strip()
                except (KeyError, ValueError):
                    await chat_hub.send_to_user(
                        user_id,
                        {
                            "type": "error",
                            "action": "send_message",
                            "data": {
                                "message": "invalid room_id",
                                "room_id": msg.get("room_id"),
                            },
                        },
                    )
                    continue
                if not content:
                    continue

                # Authorisation: only the room owner may send messages to it
                if not await chat_service.user_in_room(user_id, room_id):
                    await chat_hub.send_to_user(
                        user_id,
                        {
                            "type": "error",
                            "action": "send_message",
                            "data": {
                                "message": "not authorised for this room",
                                "room_id": str(room_id),
                            },
                        },
                    )
                    continue

                client_temp_id: str | None = msg.get("clientTempId") or None
                # Fire-and-forget — the hub pushes results back asynchronously
                asyncio.create_task(
                    _handle_send_message(
                        chat_service, user_id, room_id, content, client_temp_id, lang
                    )
                )

    except WebSocketDisconnect:
        if user_id is not None:
            chat_hub.disconnect(user_id)
    except RuntimeError as e:
        if "WebSocket is not connected" in str(e):
            if user_id is not None:
                chat_hub.disconnect(user_id)
        else:
            raise
