from __future__ import annotations

import typing
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from starlette.websockets import WebSocketDisconnect

from app.domain.chat.service import ChatService

if typing.TYPE_CHECKING:
    from fastapi.testclient import TestClient


def test_websocket_endpoint_unauthorized(client: TestClient) -> None:
    with (
        pytest.raises(WebSocketDisconnect) as exc_info,
        client.websocket_connect("/api/v1/ws/chat?token=invalid") as websocket,
    ):
        _ = websocket.receive_json()
    assert exc_info.value.code == 4001


def test_websocket_endpoint_authorized(client: TestClient) -> None:
    user_id = uuid.uuid4()
    # Patch token verification to simulate an authorized user
    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = user_id

        # Create a mock ChatService and instrument run_room_chat_ws
        mock_service = AsyncMock(spec=ChatService)
        mock_service.user_in_room.return_value = True
        mock_service.run_room_chat_ws = AsyncMock()

        # In websocket endpoint, the service is instantiated directly!
        # Wait, the code in websocket.py has: service = ChatService(...)
        # It doesn't use Depends()! So app.dependency_overrides won't work.
        # We need to patch ChatService directly in app.api.v1.websocket.

        with patch("app.api.v1.websocket.ChatService", return_value=mock_service):
            with client.websocket_connect("/api/v1/ws/chat?token=valid&lang=fr-FR") as websocket:
                # Need to read the 'connected' message first
                _ = websocket.receive_json()

                # Send a join_room first? Not required to send a message.
                websocket.send_json(
                    {
                        "type": "send_message",
                        "room_id": "11111111-1111-1111-1111-111111111111",
                        "content": "Bonjour",
                    }
                )

                # We expect our mocked run_room_chat_ws to be awaited
                # Since it's fired as an asyncio task, in TestClient it might need a small sleep
                # or we just trigger another message and receive a response to flush the loop.
                websocket.send_json({"type": "ping"})
                pong = websocket.receive_json()
                assert pong["type"] == "pong"

            # Now verify run_room_chat_ws was called with the expected language
            mock_service.run_room_chat_ws.assert_called_once()
            _, kwargs = mock_service.run_room_chat_ws.call_args
            assert kwargs.get("accept_language") == "fr-FR"
