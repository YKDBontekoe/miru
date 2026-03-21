"""WebSocket chat hub endpoint — SignalR-compatible real-time messaging.

Clients connect to ``/api/v1/ws/chat?token=<jwt>`` and exchange JSON
frames that mirror the SignalR hub-method pattern.

Client → Server frame shapes
-----------------------------
``{"type": "ping"}``
``{"type": "join_room",  "room_id": "<uuid>"}``
``{"type": "leave_room", "room_id": "<uuid>"}``
``{"type": "send_message", "room_id": "<uuid>", "content": "<text>"}``

Server → Client frame shapes
-----------------------------
``{"type": "connected",      "user_id": "<uuid>"}``
``{"type": "pong"}``
``{"type": "joined_room",    "room_id": "<uuid>"}``
``{"type": "message",        "data": {ChatMessage fields}}``
``{"type": "agent_activity", "data": {room_id, agent_names, activity, detail}}``
``{"type": "error",          "data": {"message": "<text>"}}``
"""

from __future__ import annotations

import asyncio
import json
import logging
from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.domain.auth.models import JWTPayload
from app.domain.chat.service import ChatService
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.infrastructure.repositories.chat_repo import ChatRepository
from app.infrastructure.repositories.memory_repo import MemoryRepository
from app.infrastructure.websocket.manager import chat_hub

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JWT authentication (no HTTP bearer — uses query-param token for WS upgrade)
# ---------------------------------------------------------------------------


async def _verify_token(token: str) -> UUID | None:
    """Decode a Supabase JWT without needing a repository or Depends chain."""
    settings = get_settings()
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        if alg == "HS256":
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            jwks_client = jwt.PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
            key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
        return JWTPayload(**payload).sub
    except Exception:
        logger.warning("WS auth rejected: invalid token")
        return None


# ---------------------------------------------------------------------------
# Message handler
# ---------------------------------------------------------------------------


async def _handle_send_message(
    service: ChatService,
    user_id: UUID,
    room_id: UUID,
    content: str,
) -> None:
    """Process a user message and push results via the hub."""
    try:
        await service.run_room_chat_ws(
            room_id=room_id,
            user_message=content,
            user_id=user_id,
        )
    except Exception:
        logger.exception("WS message processing failed  room=%s  user=%s", room_id, user_id)
        await chat_hub.send_to_user(
            user_id,
            {"type": "error", "data": {"message": "Failed to process message. Please retry."}},
        )


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------


@router.websocket("/ws/chat")
async def websocket_chat_hub(
    websocket: WebSocket,
    token: str = Query(..., description="Supabase JWT access token"),
) -> None:
    """Main WebSocket endpoint — acts as a SignalR hub for chat rooms."""
    user_id = await _verify_token(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await chat_hub.connect(websocket, user_id)
    await chat_hub.send_to_user(user_id, {"type": "connected", "user_id": str(user_id)})

    service = ChatService(
        chat_repo=ChatRepository(),
        agent_repo=AgentRepository(),
        memory_repo=MemoryRepository(),
    )

    try:
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
                    continue
                chat_hub.join_room(user_id, room_id)
                await chat_hub.send_to_user(
                    user_id, {"type": "joined_room", "room_id": str(room_id)}
                )

            elif msg_type == "leave_room":
                try:
                    room_id = UUID(msg["room_id"])
                except (KeyError, ValueError):
                    continue
                chat_hub.leave_room(user_id, room_id)

            elif msg_type == "send_message":
                try:
                    room_id = UUID(msg["room_id"])
                    content = str(msg.get("content", "")).strip()
                except (KeyError, ValueError):
                    continue
                if not content:
                    continue
                # Fire-and-forget — the hub pushes results back asynchronously
                asyncio.create_task(_handle_send_message(service, user_id, room_id, content))

    except WebSocketDisconnect:
        chat_hub.disconnect(user_id)
