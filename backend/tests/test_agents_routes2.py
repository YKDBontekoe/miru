from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

# Import the app to get the router
from app.main import app

client = TestClient(app)


@patch("app.routes.stream_room_responses")
def test_room_chat_route_crew_mock(mock_stream: MagicMock) -> None:
    async def mock_generator(*args: Any, **kwargs: Any) -> AsyncGenerator[str, None]:
        yield "Hello"

    mock_stream.return_value = mock_generator()

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(uuid4())}):
        response = client.post(
            "/api/rooms/room123/chat",
            headers={"Authorization": "Bearer fake_token"},
            json={"content": "hello"},
        )

    assert response.status_code == 200
