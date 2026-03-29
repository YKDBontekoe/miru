from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.api.v1.websocket import _handle_send_message


@pytest.mark.asyncio
async def test_ws_handle_send_message_not_in_room():
    mock_service = AsyncMock()
    mock_service.user_in_room.return_value = False

    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.send_to_user = AsyncMock()
        await _handle_send_message(mock_service, uuid4(), uuid4(), "hello", "temp1")
        mock_hub.send_to_user.assert_called_once()
        args = mock_hub.send_to_user.call_args[0]
        assert args[1]["type"] == "error"
