"""WebSocket connection manager — SignalR-style hub for chat rooms.

Provides a single ``chat_hub`` singleton that routes messages between
connected clients and tracks room membership. This is the Python/FastAPI
equivalent of a SignalR hub.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING
from uuid import UUID

if TYPE_CHECKING:
    from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ChatHub:
    """Manages all live WebSocket connections, grouped by chat room.

    Design mirrors ASP.NET Core SignalR's connection-group model:
    - ``connect`` / ``disconnect`` manage the per-user WebSocket.
    - ``join_room`` / ``leave_room`` control room membership.
    - ``broadcast_to_room`` fans a message out to every member in a room.
    - ``send_to_user`` sends a targeted message to one connection.
    """

    def __init__(self) -> None:
        # user_id -> active WebSocket
        self._connections: dict[UUID, WebSocket] = {}
        # room_id -> set of user_ids currently in that room
        self._rooms: dict[UUID, set[UUID]] = {}

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self, websocket: WebSocket, user_id: UUID) -> None:
        """Accept the upgrade and register the connection."""
        await websocket.accept()
        self._connections[user_id] = websocket
        logger.info("WS connected  user=%s  total=%d", user_id, len(self._connections))

    def disconnect(self, user_id: UUID) -> None:
        """Remove the connection and evict the user from all rooms."""
        self._connections.pop(user_id, None)
        for members in self._rooms.values():
            members.discard(user_id)
        logger.info("WS disconnected  user=%s  total=%d", user_id, len(self._connections))

    # ------------------------------------------------------------------
    # Room management
    # ------------------------------------------------------------------

    def join_room(self, user_id: UUID, room_id: UUID) -> None:
        """Add a user to a room group."""
        self._rooms.setdefault(room_id, set()).add(user_id)

    def leave_room(self, user_id: UUID, room_id: UUID) -> None:
        """Remove a user from a room group."""
        self._rooms.get(room_id, set()).discard(user_id)

    # ------------------------------------------------------------------
    # Messaging
    # ------------------------------------------------------------------

    async def _send(self, user_id: UUID, payload: dict) -> None:
        ws = self._connections.get(user_id)
        if not ws:
            return
        try:
            await ws.send_text(json.dumps(payload, default=str))
        except Exception:
            logger.warning("WS send failed  user=%s — disconnecting", user_id)
            self.disconnect(user_id)

    async def send_to_user(self, user_id: UUID, payload: dict) -> None:
        """Send a message to a single connected user."""
        await self._send(user_id, payload)

    async def broadcast_to_room(
        self,
        room_id: UUID,
        payload: dict,
        exclude: UUID | None = None,
    ) -> None:
        """Fan a message out to every user currently in *room_id*."""
        members = list(self._rooms.get(room_id, set()))
        tasks = [self._send(uid, payload) for uid in members if uid != exclude]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


# ---------------------------------------------------------------------------
# Module-level singleton shared across all requests (like a SignalR hub)
# ---------------------------------------------------------------------------
chat_hub: ChatHub = ChatHub()
