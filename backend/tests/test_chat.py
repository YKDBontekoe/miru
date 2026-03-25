from __future__ import annotations

import typing
import uuid
from unittest.mock import AsyncMock, patch

from app.domain.chat.service import ChatService

if typing.TYPE_CHECKING:
    from fastapi.testclient import TestClient


def test_websocket_chat_service_instantiation(client: TestClient) -> None:
    """Test that ChatService is instantiated correctly with all dependencies including AgentService."""
    user_id = uuid.uuid4()
    with patch("app.api.v1.websocket._verify_token") as mock_verify:
        mock_verify.return_value = user_id

        # We patch ChatService to intercept the call and check its arguments
        with patch("app.api.v1.websocket.ChatService") as mock_chat_service:
            # Setup the mock so it doesn't fail when methods are called on the service
            mock_instance = AsyncMock(spec=ChatService)
            mock_chat_service.return_value = mock_instance
            mock_instance.user_in_room.return_value = True

            with client.websocket_connect("/api/v1/ws/chat?token=valid") as websocket:
                _ = websocket.receive_json()

            # Verify ChatService was instantiated correctly
            mock_chat_service.assert_called_once()

            # Extract the kwargs used for instantiation
            _, kwargs = mock_chat_service.call_args

            # Verify the 4 dependencies are present
            assert "chat_repo" in kwargs
            assert "agent_repo" in kwargs
            assert "memory_repo" in kwargs
            assert "agent_service" in kwargs

            # Verify the agent_service passed is actually an instance of AgentService
            from app.domain.agents.service import AgentService

            assert isinstance(kwargs["agent_service"], AgentService)
