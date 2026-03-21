"""WebSocket connection manager — SignalR-style hub for chat rooms.

Provides a single ``chat_hub`` singleton that routes messages between
connected clients and tracks room membership. This is the Python/FastAPI
equivalent of a SignalR hub.
"""

from __future__ import annotations

import asyncio
import contextlib
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
        # user_ids whose connection broke and are awaiting async cleanup
        self._pending_disconnects: set[UUID] = set()

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self, websocket: WebSocket, user_id: UUID) -> None:
        """Accept the upgrade, closing any previous connection for this user."""
        existing = self._connections.get(user_id)
        if existing is not None:
            with contextlib.suppress(Exception):
                await existing.close()
            self.disconnect(user_id)

        await websocket.accept()
        self._connections[user_id] = websocket
        logger.info("WS connected  user=%s  total=%d", user_id, len(self._connections))

    def disconnect(self, user_id: UUID) -> None:
        """Remove the connection and evict the user from all rooms."""
        self._connections.pop(user_id, None)
        self._pending_disconnects.discard(user_id)
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
        if user_id in self._pending_disconnects:
            return
        ws = self._connections.get(user_id)
        if not ws:
            return
        try:
            await ws.send_text(json.dumps(payload, default=str))
        except Exception:
            logger.warning("WS send failed  user=%s — scheduling disconnect", user_id)
            if user_id not in self._pending_disconnects:
                self._pending_disconnects.add(user_id)
                asyncio.create_task(self._disconnect_worker(user_id))

    async def _disconnect_worker(self, user_id: UUID) -> None:
        """Close the broken socket and clean up outside any broadcast iteration."""
        ws = self._connections.get(user_id)
        if ws is not None:
            with contextlib.suppress(Exception):
                await ws.close()
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
