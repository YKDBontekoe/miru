from __future__ import annotations

import typing
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from starlette.websockets import WebSocketDisconnect

import app.api.dependencies as app_api_dependencies
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
    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = user_id

        mock_service = AsyncMock(spec=ChatService)
        mock_service.user_in_room.return_value = True
        mock_service.run_room_chat_ws = AsyncMock()

        app.dependency_overrides[app_api_dependencies.get_chat_service] = lambda: mock_service

        try:
            with client.websocket_connect("/api/v1/ws/chat?token=valid&lang=fr-FR") as websocket:
                _ = websocket.receive_json()

                websocket.send_json(
                    {
                        "type": "send_message",
                        "room_id": "11111111-1111-1111-1111-111111111111",
                        "content": "Bonjour",
                    }
                )

                websocket.send_json({"type": "ping"})
                pong = websocket.receive_json()
                assert pong["type"] == "pong"
        finally:
            app.dependency_overrides.pop(app_api_dependencies.get_chat_service, None)

        mock_service.run_room_chat_ws.assert_called_once()
        _, kwargs = mock_service.run_room_chat_ws.call_args
        assert kwargs.get("accept_language") == "fr-FR"


def test_websocket_endpoint_runtime_error(client: TestClient) -> None:
    user_id = uuid.uuid4()
    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = user_id
        with patch("starlette.websockets.WebSocket.receive_text") as mock_receive:
            mock_receive.side_effect = RuntimeError(
                'WebSocket is not connected. Need to call "accept" first.'
            )
            with patch("app.api.v1.websocket.chat_hub.disconnect") as mock_disconnect:
                mock_service = AsyncMock(spec=ChatService)
                app.dependency_overrides[app_api_dependencies.get_chat_service] = lambda: (
                    mock_service
                )
                try:
                    with client.websocket_connect("/api/v1/ws/chat?token=valid"):
                        pass
                finally:
                    app.dependency_overrides.pop(app_api_dependencies.get_chat_service, None)
                mock_disconnect.assert_called_once_with(user_id)


def test_websocket_endpoint_runtime_error_other(client: TestClient) -> None:
    user_id = uuid.uuid4()
    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = user_id
        with patch("starlette.websockets.WebSocket.receive_text") as mock_receive:
            mock_receive.side_effect = RuntimeError("Some other random error")

            mock_service = AsyncMock(spec=ChatService)
            app.dependency_overrides[app_api_dependencies.get_chat_service] = lambda: mock_service
            try:
                with (
                    pytest.raises(RuntimeError, match="Some other random error"),
                    client.websocket_connect("/api/v1/ws/chat?token=valid"),
                ):
                    pass
            finally:
                app.dependency_overrides.pop(app_api_dependencies.get_chat_service, None)


def test_websocket_endpoint_runtime_error_during_connect() -> None:
    import uuid
    from unittest.mock import AsyncMock, patch

    from fastapi import WebSocket

    from app.api.v1.websocket import websocket_chat_hub
    from app.domain.chat.service import ChatService

    user_id = uuid.uuid4()
    mock_ws = AsyncMock(spec=WebSocket)

    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = user_id
        with patch("app.api.v1.websocket.chat_hub.connect", new_callable=AsyncMock) as mock_connect:
            mock_connect.side_effect = RuntimeError(
                'WebSocket is not connected. Need to call "accept" first.'
            )
            with patch("app.api.v1.websocket.chat_hub.disconnect") as mock_disconnect:
                import asyncio

                mock_service = AsyncMock(spec=ChatService)
                asyncio.run(websocket_chat_hub(mock_ws, mock_service, token="valid", lang="en-US"))
                mock_disconnect.assert_called_once_with(user_id)


def test_websocket_endpoint_runtime_error_during_close() -> None:
    from unittest.mock import AsyncMock, patch

    from fastapi import WebSocket

    from app.api.v1.websocket import websocket_chat_hub
    from app.domain.chat.service import ChatService

    mock_ws = AsyncMock(spec=WebSocket)
    mock_ws.close.side_effect = RuntimeError(
        'WebSocket is not connected. Need to call "accept" first.'
    )

    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = None
        with patch("app.api.v1.websocket.chat_hub.disconnect") as mock_disconnect:
            import asyncio

            mock_service = AsyncMock(spec=ChatService)
            asyncio.run(websocket_chat_hub(mock_ws, mock_service, token="invalid", lang="en-US"))
            mock_disconnect.assert_not_called()
