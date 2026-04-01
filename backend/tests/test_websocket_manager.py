from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.infrastructure.websocket.manager import ChatHub


@pytest.mark.asyncio
async def test_disconnect_worker_suppresses_exception() -> None:
    """Verify that _disconnect_worker catches exceptions during ws.close() and still calls disconnect."""
    hub = ChatHub()
    user_id = uuid.uuid4()

    # Mock WebSocket that raises an exception on close
    mock_ws = AsyncMock()
    mock_ws.close.side_effect = Exception("Failed to close socket")

    hub._connections[user_id] = mock_ws

    with patch.object(hub, "disconnect", wraps=hub.disconnect) as mock_disconnect:
        await hub._disconnect_worker(user_id)

        # Verify close was called
        mock_ws.close.assert_awaited_once()
        # Verify disconnect was STILL called despite the exception
        mock_disconnect.assert_called_once_with(user_id)
        # Verify the user is removed from _connections (via disconnect)
        assert user_id not in hub._connections


@pytest.mark.asyncio
async def test_disconnect_worker_no_connection() -> None:
    """Verify that _disconnect_worker handles cases where the user ID is not in _connections."""
    hub = ChatHub()
    user_id = uuid.uuid4()

    # user_id is NOT in hub._connections

    with patch.object(hub, "disconnect", wraps=hub.disconnect) as mock_disconnect:
        await hub._disconnect_worker(user_id)

        # Verify disconnect was called
        mock_disconnect.assert_called_once_with(user_id)


@pytest.mark.asyncio
async def test_disconnect_worker_happy_path() -> None:
    """Verify that _disconnect_worker works correctly when no exception is raised."""
    hub = ChatHub()
    user_id = uuid.uuid4()

    mock_ws = AsyncMock()
    hub._connections[user_id] = mock_ws

    with patch.object(hub, "disconnect", wraps=hub.disconnect) as mock_disconnect:
        await hub._disconnect_worker(user_id)

        # Verify close was called
        mock_ws.close.assert_awaited_once()
        # Verify disconnect was called
        mock_disconnect.assert_called_once_with(user_id)
        # Verify user is removed
        assert user_id not in hub._connections
