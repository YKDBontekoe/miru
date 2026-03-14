"""Tests for the productivity domain (Tasks and Notes)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.security.auth import get_current_user
from app.domain.productivity.models import Note, Task
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def clear_productivity_db() -> AsyncGenerator[None]:
    """Clear tasks and notes tables before each test."""
    await Task.all().delete()
    await Note.all().delete()
    yield
    await Task.all().delete()
    await Note.all().delete()


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
    await Task.create(user_id=mock_user_id, title="Task 1")
    await Task.create(user_id=mock_user_id, title="Task 2")
    await Task.create(user_id=another_user_id, title="Other User Task")

    response = await async_client.get("/api/v1/productivity/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    titles = [t["title"] for t in data]
    assert "Task 1" in titles
    assert "Task 2" in titles
    assert "Other User Task" not in titles


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
