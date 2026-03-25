"""Tests for the productivity domain (Tasks and Notes)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator, Generator
from datetime import UTC

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from tortoise.exceptions import IntegrityError

from app.core.security.auth import get_current_user
from app.domain.productivity.models import CalendarEvent, Note, Task
from app.infrastructure.database.utils import handle_db_errors
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def clear_productivity_db() -> AsyncGenerator[None]:
    """Clear tasks and notes tables before each test."""
    await Task.all().delete()
    await Note.all().delete()
    await CalendarEvent.all().delete()
    yield
    await Task.all().delete()
    await Note.all().delete()
    await CalendarEvent.all().delete()


@pytest.fixture
def mock_user_id() -> uuid.UUID:
    """Return a mock user UUID for testing."""
    return uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def another_user_id() -> uuid.UUID:
    """Return a secondary mock user UUID for testing isolation."""
    return uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def override_get_current_user(mock_user_id: uuid.UUID) -> Generator[None]:
    """Override the get_current_user dependency."""
    app.dependency_overrides[get_current_user] = lambda: mock_user_id
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient]:
    """Return an AsyncClient for testing the app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_create_task(async_client: AsyncClient, override_get_current_user: None) -> None:
    """Test creating a task."""
    response = await async_client.post(
        "/api/v1/productivity/tasks",
        json={"title": "Test Task", "description": "Test Description"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["description"] == "Test Description"
    assert data["is_completed"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_list_tasks(
    async_client: AsyncClient,
    mock_user_id: uuid.UUID,
    another_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test listing tasks, ensuring isolation."""
    import datetime

    due_date = datetime.datetime(2026, 12, 31, tzinfo=datetime.UTC)
    await Task.create(user_id=mock_user_id, title="Task 1", due_date=due_date)
    await Task.create(user_id=mock_user_id, title="Task 2")
    await Task.create(user_id=another_user_id, title="Other User Task")

    response = await async_client.get("/api/v1/productivity/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Check that due_date is correctly returned
    task1 = next(t for t in data if t["title"] == "Task 1")
    assert task1["due_date"] is not None
    assert task1["due_date"].startswith("2026-12-31")

    task2 = next(t for t in data if t["title"] == "Task 2")
    assert task2["due_date"] is None

    titles = [t["title"] for t in data]
    assert "Task 1" in titles
    assert "Task 2" in titles
    assert "Other User Task" not in titles


@pytest.mark.asyncio
async def test_create_task_with_due_date(
    async_client: AsyncClient, override_get_current_user: None
) -> None:
    """Test creating a task with a due_date."""
    response = await async_client.post(
        "/api/v1/productivity/tasks",
        json={"title": "Timed Task", "due_date": "2026-12-31T00:00:00Z"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Timed Task"
    assert data["due_date"] is not None


@pytest.mark.asyncio
async def test_update_task_due_date(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test setting and clearing due_date on a task."""
    task = await Task.create(user_id=mock_user_id, title="Task With Due Date")

    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={"due_date": "2026-06-01T00:00:00Z"},
    )
    assert response.status_code == 200
    assert response.json()["due_date"] is not None

    # Clear due_date by setting to None
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={"due_date": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_task(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test updating a task."""
    task = await Task.create(user_id=mock_user_id, title="Original Task")

    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={"title": "Updated Task", "is_completed": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Task"
    assert data["is_completed"] is True

    # Test update with empty data
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"

    # Test update with None values to filter out
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={"title": None, "is_completed": None},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"


@pytest.mark.asyncio
async def test_update_task_not_found_or_forbidden(
    async_client: AsyncClient,
    another_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test updating a task owned by someone else or a missing task."""
    # Another user's task
    task = await Task.create(user_id=another_user_id, title="Not my task")

    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={"title": "Trying to update"},
    )
    assert response.status_code == 404

    # Missing task
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{uuid.uuid4()}",
        json={"title": "Does not exist"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test deleting a task."""
    task = await Task.create(user_id=mock_user_id, title="Task to Delete")

    response = await async_client.delete(f"/api/v1/productivity/tasks/{task.id}")
    assert response.status_code == 204

    # Verify it's gone
    assert await Task.filter(id=task.id).count() == 0


@pytest.mark.asyncio
async def test_delete_task_not_found_or_forbidden(
    async_client: AsyncClient,
    another_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test deleting a task owned by someone else or a missing task."""
    # Another user's task
    task = await Task.create(user_id=another_user_id, title="Not my task")

    response = await async_client.delete(f"/api/v1/productivity/tasks/{task.id}")
    assert response.status_code == 404

    # Missing task
    response = await async_client.delete(f"/api/v1/productivity/tasks/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_note(async_client: AsyncClient, override_get_current_user: None) -> None:
    """Test creating a note."""
    response = await async_client.post(
        "/api/v1/productivity/notes",
        json={"title": "Test Note", "content": "This is a test note."},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Note"
    assert data["content"] == "This is a test note."
    assert data["is_pinned"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_list_notes(
    async_client: AsyncClient,
    mock_user_id: uuid.UUID,
    another_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test listing notes, checking isolation and pin ordering."""
    await Note.create(user_id=mock_user_id, title="Note 1", content="C1")
    await Note.create(user_id=mock_user_id, title="Note 2", content="C2", is_pinned=True)
    await Note.create(user_id=another_user_id, title="Other User Note", content="O1")

    response = await async_client.get("/api/v1/productivity/notes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Pinned should be first
    assert data[0]["title"] == "Note 2"
    titles = [n["title"] for n in data]
    assert "Other User Note" not in titles


@pytest.mark.asyncio
async def test_update_note(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test updating a note."""
    note = await Note.create(user_id=mock_user_id, title="Old Note", content="Old content")

    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}",
        json={"is_pinned": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_pinned"] is True

    # Test update with empty data
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}",
        json={},
    )
    assert response.status_code == 200

    # Test update with None values to filter out
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}",
        json={"title": None, "content": None, "is_pinned": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_note_not_found_or_forbidden(
    async_client: AsyncClient,
    another_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test updating a note owned by someone else or missing."""
    note = await Note.create(user_id=another_user_id, title="Not my note", content="C1")

    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}",
        json={"title": "Updated Note"},
    )
    assert response.status_code == 404

    response = await async_client.patch(
        f"/api/v1/productivity/notes/{uuid.uuid4()}",
        json={"title": "Does not exist"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_note(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test deleting a note."""
    note = await Note.create(user_id=mock_user_id, title="Note to Delete", content="Content")

    response = await async_client.delete(f"/api/v1/productivity/notes/{note.id}")
    assert response.status_code == 204

    # Verify it's gone
    assert await Note.filter(id=note.id).count() == 0


@pytest.mark.asyncio
async def test_delete_note_not_found_or_forbidden(
    async_client: AsyncClient,
    another_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test deleting a note owned by someone else or missing."""
    note = await Note.create(user_id=another_user_id, title="Not my note", content="C1")

    response = await async_client.delete(f"/api/v1/productivity/notes/{note.id}")
    assert response.status_code == 404

    response = await async_client.delete(f"/api/v1/productivity/notes/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_event(async_client: AsyncClient, override_get_current_user: None) -> None:
    """Test creating a calendar event."""
    from datetime import datetime, timedelta

    now = datetime.now(UTC)
    response = await async_client.post(
        "/api/v1/productivity/events",
        json={
            "title": "Test Event",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Test Event"


@pytest.mark.asyncio
async def test_create_event_invalid_time(
    async_client: AsyncClient, override_get_current_user: None
) -> None:
    """Test creating a calendar event with invalid times."""
    from datetime import datetime, timedelta

    now = datetime.now(UTC)
    # The BaseModel validator catches this before it reaches the service,
    # so we test the model validation directly to cover lines 202-207.
    response = await async_client.post(
        "/api/v1/productivity/events",
        json={
            "title": "Invalid Event",
            "start_time": now.isoformat(),
            "end_time": (now - timedelta(hours=1)).isoformat(),
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_events(
    async_client: AsyncClient,
    mock_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test listing calendar events."""
    from datetime import datetime, timedelta

    now = datetime.now(UTC)
    await CalendarEvent.create(
        user_id=mock_user_id, title="Event 1", start_time=now, end_time=now + timedelta(hours=1)
    )

    response = await async_client.get("/api/v1/productivity/events")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_update_event(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test updating a calendar event."""
    from datetime import datetime, timedelta

    now = datetime.now(UTC)
    event = await CalendarEvent.create(
        user_id=mock_user_id, title="Event 1", start_time=now, end_time=now + timedelta(hours=1)
    )

    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}",
        json={"title": "Updated Event"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Event"

    # Test update with empty data
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}",
        json={},
    )
    assert response.status_code == 200

    # Test update with None values to filter out
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}",
        json={"title": None, "start_time": None, "end_time": None, "is_all_day": None},
    )
    assert response.status_code == 200

    # Test update with invalid time range
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}",
        json={"end_time": (now - timedelta(hours=1)).isoformat()},
    )
    assert response.status_code == 400
    assert "end_time must be after start_time" in response.json()["detail"]["message"]


@pytest.mark.asyncio
async def test_delete_event(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test deleting a calendar event."""
    from datetime import datetime, timedelta

    now = datetime.now(UTC)
    event = await CalendarEvent.create(
        user_id=mock_user_id, title="Event 1", start_time=now, end_time=now + timedelta(hours=1)
    )

    response = await async_client.delete(f"/api/v1/productivity/events/{event.id}")
    assert response.status_code == 204
    assert await CalendarEvent.filter(id=event.id).count() == 0


@pytest.mark.asyncio
async def test_handle_db_errors_integrity() -> None:
    """Test the handle_db_errors context manager handles IntegrityError."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("create test"):
            raise IntegrityError("mock integrity error")
    assert exc_info.value.status_code == 500  # type: ignore[unreachable]
    assert "Database error occurred while creating test" in exc_info.value.detail


@pytest.mark.asyncio
async def test_handle_db_errors_unexpected() -> None:
    """Test the handle_db_errors context manager handles unexpected Exceptions."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("list test"):
            raise ValueError("mock generic error")
    assert exc_info.value.status_code == 400  # type: ignore[unreachable]
    assert "mock generic error" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("update test"):
            raise KeyError("mock key error")
    assert exc_info.value.status_code == 500  # type: ignore[unreachable]
    assert "Failed to update test" in exc_info.value.detail


@pytest.mark.asyncio
async def test_handle_db_errors_httpexception() -> None:
    """Test the handle_db_errors context manager re-raises HTTPException."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("delete test"):
            raise HTTPException(status_code=400, detail="existing error")
    assert exc_info.value.status_code == 400  # type: ignore[unreachable]
    assert "existing error" in exc_info.value.detail


@pytest.mark.asyncio
async def test_handle_db_errors_action_mapping() -> None:
    """Test the string replacement in action messages."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("list notes"):
            raise IntegrityError("mock error")
    assert "listing notes" in exc_info.value.detail  # type: ignore[unreachable]

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("update task"):
            raise IntegrityError("mock error")
    assert "updating task" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("delete calendar event"):
            raise IntegrityError("mock error")
    assert "deleting calendar event" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("read file"):
            raise IntegrityError("mock error")
    assert "reading file" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("create task"):
            raise Exception("unexpected create test")
    assert exc_info.value.status_code == 500  # type: ignore[unreachable]


@pytest.mark.asyncio
async def test_list_notes_and_events_without_agent(
    async_client: AsyncClient,
    mock_user_id: uuid.UUID,
    override_get_current_user: None,
) -> None:
    """Test that notes and events without agents can be listed without NoValuesFetched errors."""
    from datetime import UTC, datetime, timedelta

    # Create note without agent or origin_message
    await Note.create(user_id=mock_user_id, title="Orphan Note", content="Content")

    # Create event without agent or origin_message
    now = datetime.now(UTC)
    await CalendarEvent.create(
        user_id=mock_user_id,
        title="Orphan Event",
        start_time=now,
        end_time=now + timedelta(hours=1),
    )

    # Note list should not throw 500 error
    note_response = await async_client.get("/api/v1/productivity/notes")
    assert note_response.status_code == 200
    notes_data = note_response.json()
    assert len(notes_data) == 1
    assert notes_data[0]["agent_id"] is None
    assert notes_data[0]["origin_message_id"] is None

    # Event list should not throw 500 error
    event_response = await async_client.get("/api/v1/productivity/events")
    assert event_response.status_code == 200
    events_data = event_response.json()
    assert len(events_data) == 1
    assert events_data[0]["agent_id"] is None
    assert events_data[0]["origin_message_id"] is None


@pytest.mark.asyncio
async def test_map_note_and_event_no_values_fetched() -> None:
    """Test that _map_note and _map_event correctly handle missing prefetched relations."""
    import uuid
    from datetime import UTC, datetime

    from app.infrastructure.repositories.productivity_repo import _map_event, _map_note

    mock_user_id = uuid.uuid4()
    mock_id = uuid.uuid4()

    # Create an unsaved Note instance with string IDs (which extract_uuid rejects, returning None)
    # This forces the code to fall back to the relation (getattr(note, "agent", None))
    note = Note(
        id=mock_id,
        user_id=mock_user_id,
        title="Test",
        content="Test",
        agent_id=None,  # type: ignore
        origin_message_id=None,  # type: ignore
    )
    # Mapping should safely catch NoValuesFetched for agent and origin_message
    entity = _map_note(note)
    assert entity.agent_id is None
    assert entity.origin_message_id is None

    # Create an unsaved CalendarEvent instance with string IDs
    now = datetime.now(UTC)
    event = CalendarEvent(
        id=mock_id,
        user_id=mock_user_id,
        title="Test Event",
        start_time=now,
        end_time=now,
        agent_id=None,  # type: ignore
        origin_message_id=None,  # type: ignore
    )
    # Mapping should safely catch NoValuesFetched for agent and origin_message
    event_entity = _map_event(event)
    assert event_entity.agent_id is None
    assert event_entity.origin_message_id is None
