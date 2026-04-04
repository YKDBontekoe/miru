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
    # Now verify token logic relies on auth_service.decode_jwt which we can patch via dependency
    mock_auth_service = AsyncMock()
    mock_auth_service.decode_jwt.return_value = type("Payload", (), {"sub": user_id})()

    # Create a mock ChatService and instrument run_room_chat_ws
    mock_chat_service = AsyncMock(spec=ChatService)
    mock_chat_service.user_in_room.return_value = True
    mock_chat_service.run_room_chat_ws = AsyncMock()

    # In websocket endpoint, the service is injected via Depends
    from app.main import app
    from app.api.dependencies import get_auth_service, get_chat_service

    app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
    app.dependency_overrides[get_chat_service] = lambda: mock_chat_service

    try:
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
        mock_chat_service.run_room_chat_ws.assert_called_once()
        _, kwargs = mock_chat_service.run_room_chat_ws.call_args
        assert kwargs.get("accept_language") == "fr-FR"
    finally:
        app.dependency_overrides.clear()


def test_websocket_endpoint_runtime_error(client: TestClient) -> None:
    user_id = uuid.uuid4()

    mock_auth_service = AsyncMock()
    mock_auth_service.decode_jwt.return_value = type("Payload", (), {"sub": user_id})()

    from app.main import app
    from app.api.dependencies import get_auth_service, get_chat_service

    app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
    app.dependency_overrides[get_chat_service] = lambda: AsyncMock(spec=ChatService)

    try:
        # TestClient creates a Starlette WebSocket. We can mock it.
        with patch("starlette.websockets.WebSocket.receive_text") as mock_receive:
            mock_receive.side_effect = RuntimeError(
                'WebSocket is not connected. Need to call "accept" first.'
            )
            with patch("app.api.v1.websocket.chat_hub.disconnect") as mock_disconnect:
                with client.websocket_connect("/api/v1/ws/chat?token=valid"):
                    pass
                mock_disconnect.assert_called_once_with(user_id)
    finally:
        app.dependency_overrides.clear()


def test_websocket_endpoint_runtime_error_other(client: TestClient) -> None:
    user_id = uuid.uuid4()

    mock_auth_service = AsyncMock()
    mock_auth_service.decode_jwt.return_value = type("Payload", (), {"sub": user_id})()

    from app.main import app
    from app.api.dependencies import get_auth_service, get_chat_service

    app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
    app.dependency_overrides[get_chat_service] = lambda: AsyncMock(spec=ChatService)

    try:
        with patch("starlette.websockets.WebSocket.receive_text") as mock_receive:
            mock_receive.side_effect = RuntimeError("Some other random error")
            with pytest.raises(RuntimeError, match="Some other random error"):
                with client.websocket_connect("/api/v1/ws/chat?token=valid"):
                    pass
    finally:
        app.dependency_overrides.clear()


def test_websocket_endpoint_runtime_error_during_connect() -> None:
    # Instead of using TestClient which hangs, let's test the endpoint directly
    # since it's an async function taking a WebSocket.
    import uuid
    from unittest.mock import AsyncMock, patch

    from fastapi import WebSocket

    from app.api.v1.websocket import websocket_chat_hub

    user_id = uuid.uuid4()
    mock_ws = AsyncMock(spec=WebSocket)

    mock_auth_service = AsyncMock()
    mock_auth_service.decode_jwt.return_value = type("Payload", (), {"sub": user_id})()
    mock_chat_service = AsyncMock(spec=ChatService)

    with patch("app.api.v1.websocket.chat_hub.connect", new_callable=AsyncMock) as mock_connect:
        mock_connect.side_effect = RuntimeError(
            'WebSocket is not connected. Need to call "accept" first.'
        )
        with patch("app.api.v1.websocket.chat_hub.disconnect") as mock_disconnect:
            import asyncio

            asyncio.run(websocket_chat_hub(
                mock_ws,
                token="valid",
                lang="en-US",
                auth_service=mock_auth_service,
                chat_service=mock_chat_service
            ))

            mock_disconnect.assert_called_once_with(user_id)


def test_websocket_endpoint_runtime_error_during_close() -> None:
    from unittest.mock import AsyncMock, patch

    from fastapi import WebSocket

    from app.api.v1.websocket import websocket_chat_hub

    mock_ws = AsyncMock(spec=WebSocket)
    mock_ws.close.side_effect = RuntimeError(
        'WebSocket is not connected. Need to call "accept" first.'
    )

    mock_auth_service = AsyncMock()
    mock_auth_service.decode_jwt.side_effect = Exception("Invalid token")
    mock_chat_service = AsyncMock(spec=ChatService)

    with patch("app.api.v1.websocket.chat_hub.disconnect") as mock_disconnect:
        import asyncio

        asyncio.run(websocket_chat_hub(
            mock_ws,
            token="invalid",
            lang="en-US",
            auth_service=mock_auth_service,
            chat_service=mock_chat_service
        ))

        mock_disconnect.assert_not_called()
