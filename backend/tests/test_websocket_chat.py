from __future__ import annotations

import typing
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from starlette.websockets import WebSocketDisconnect

from app.api.dependencies import get_chat_service
from app.domain.chat.service import ChatService
from app.main import app

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
        mock_service.run_room_chat_ws = AsyncMock()

        app.dependency_overrides[get_chat_service] = lambda: mock_service

        try:
            with client.websocket_connect("/api/v1/ws/chat?token=valid&lang=fr-FR") as websocket:
                # The connection was accepted; send a chat message
                websocket.send_json(
                    {
                        "type": "message",
                        "room_id": "11111111-1111-1111-1111-111111111111",
                        "message": "Bonjour",
                    }
                )

                # We expect our mocked run_room_chat_ws to be awaited and it shouldn't produce a real response since it's mocked,
                # so we can disconnect.

            # Now verify run_room_chat_ws was called with the expected language
            mock_service.run_room_chat_ws.assert_called_once()
            _, kwargs = mock_service.run_room_chat_ws.call_args
            assert kwargs.get("accept_language") == "fr-FR"
        finally:
            app.dependency_overrides.clear()
