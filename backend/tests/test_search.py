from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_memory_service
from app.core.security.auth import get_current_user
from app.domain.auth.models import Profile
from app.domain.memory.service import MemoryService
from app.domain.productivity.models import Note, Task
from app.infrastructure.database.models.chat_models import ChatMessage, ChatRoom


@pytest.fixture
def mock_memory_service():
    return AsyncMock(spec=MemoryService)


@pytest.fixture
def override_dependencies(client, test_user_id, mock_memory_service):
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: UUID(test_user_id)
    app.dependency_overrides[get_memory_service] = lambda: mock_memory_service
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
@pytest.mark.usefixtures("override_dependencies")
async def test_unified_search_success_all_sources(
    client: TestClient,
    test_user_id: str,
    mock_memory_service: AsyncMock,
    authed_headers: dict[str, str],
):
    # Arrange
    # 1. Mock MemoryService
    mock_memory = AsyncMock()
    mock_memory.id = uuid4()
    mock_memory.content = "memory content test"
    mock_memory.created_at = None
    mock_memory.meta = {"key": "value"}
    mock_memory_service.retrieve_memories.return_value = [mock_memory]

    # Insert test data into the in-memory SQLite DB setup by conftest.py

    mock_profile = Profile(id=test_user_id, email="test@test.com")
    await mock_profile.save(force_create=True)

    await Note.create(
        id=uuid4(), user_id=mock_profile.id, title="note title test", content="note content"
    )

    await Task.create(
        id=uuid4(),
        user_id=mock_profile.id,
        title="task title test",
        description="task description",
        is_completed=False,
    )

    # Chat message requires a room, ChatRoom requires a name
    room = await ChatRoom.create(id=uuid4(), user_id=mock_profile.id, name="test room")

    await ChatMessage.create(
        id=uuid4(),
        user_id=mock_profile.id,
        agent_id=None,
        room_id=room.id,
        content="chat content test",
        message_type="text",
        attachments=[],
    )

    # Act
    response = client.get("/api/v1/search?q=test", headers=authed_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "test"

    sources = [r["source"] for r in data["results"]]
    print(sources)

    assert "memory" in sources
    assert "note" in sources
    assert "task" in sources
    assert "chat" in sources

    assert len(data["results"]) == 4


@pytest.mark.asyncio
@pytest.mark.usefixtures("override_dependencies")
async def test_unified_search_note_content_fallback(
    client: TestClient,
    test_user_id: str,
    mock_memory_service: AsyncMock,
    authed_headers: dict[str, str],
):
    # Arrange
    mock_profile = Profile(id=test_user_id, email="test@test.com")
    await mock_profile.save(force_create=True)
    mock_memory_service.retrieve_memories.return_value = []

    # One note matches by title
    await Note.create(
        id=uuid4(), user_id=mock_profile.id, title="note test match", content="some content"
    )

    # Another note matches by content only
    await Note.create(
        id=uuid4(),
        user_id=mock_profile.id,
        title="unrelated title",
        content="this is a test match in content",
    )

    # Act
    response = client.get("/api/v1/search?q=test", headers=authed_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "test"
    assert len(data["results"]) == 2

    sources = [r["source"] for r in data["results"]]
    assert sources == ["note", "note"]


@pytest.mark.asyncio
@pytest.mark.usefixtures("override_dependencies")
async def test_unified_search_chaos_memory_failure(
    client: TestClient,
    test_user_id: str,
    mock_memory_service: AsyncMock,
    authed_headers: dict[str, str],
):
    # Arrange
    mock_profile = Profile(id=test_user_id, email="test@test.com")
    await mock_profile.save(force_create=True)

    # Memory service fails
    mock_memory_service.retrieve_memories.side_effect = Exception("Memory service down")

    # We add a note to ensure the rest of the search continues and succeeds
    await Note.create(
        id=uuid4(), user_id=mock_profile.id, title="note test match", content="some content"
    )

    # Act
    response = client.get("/api/v1/search?q=test", headers=authed_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "test"
    assert len(data["results"]) == 1
    assert data["results"][0]["source"] == "note"


@pytest.mark.asyncio
@pytest.mark.usefixtures("override_dependencies")
async def test_unified_search_chaos_db_timeout(
    client: TestClient,
    test_user_id: str,
    mock_memory_service: AsyncMock,
    authed_headers: dict[str, str],
):
    # Arrange
    mock_profile = Profile(id=test_user_id, email="test@test.com")
    await mock_profile.save(force_create=True)

    # Memory search succeeds but is empty
    mock_memory_service.retrieve_memories.return_value = []

    # Mock DB failures for Note and Task searches
    with (
        patch(
            "app.domain.productivity.models.Note.filter",
            side_effect=Exception("DB Connection Timeout"),
        ),
        patch(
            "app.domain.productivity.models.Task.filter",
            side_effect=Exception("DB Connection Timeout"),
        ),
    ):
        # We'll allow ChatMessage to succeed and return one result
        room = await ChatRoom.create(id=uuid4(), user_id=mock_profile.id, name="test room")
        await ChatMessage.create(
            id=uuid4(),
            user_id=mock_profile.id,
            agent_id=None,
            room_id=room.id,
            content="chat test match",
            message_type="text",
            attachments=[],
        )

        # Act
        response = client.get("/api/v1/search?q=test", headers=authed_headers)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "test"
        # 0 memory, 0 note (fail), 0 task (fail), 1 chat (success)
        assert len(data["results"]) == 1
        assert data["results"][0]["source"] == "chat"
