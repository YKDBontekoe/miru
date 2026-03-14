"""Tests for the productivity domain (Tasks and Notes)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security.auth import get_current_user
from app.domain.productivity.models import Note, Task
from app.main import app


@pytest.fixture(autouse=True)
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
def override_get_current_user(mock_user_id: uuid.UUID) -> Generator[None]:
    """Override the get_current_user dependency."""
    app.dependency_overrides[get_current_user] = lambda: mock_user_id
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
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
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test listing tasks."""
    await Task.create(user_id=mock_user_id, title="Task 1")
    await Task.create(user_id=mock_user_id, title="Task 2")

    response = await async_client.get("/api/v1/productivity/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] in ("Task 1", "Task 2")


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
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test listing notes."""
    await Note.create(user_id=mock_user_id, title="Note 1", content="C1")
    await Note.create(user_id=mock_user_id, title="Note 2", content="C2", is_pinned=True)

    response = await async_client.get("/api/v1/productivity/notes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Pinned should be first
    assert data[0]["title"] == "Note 2"


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
async def test_delete_note(
    async_client: AsyncClient, mock_user_id: uuid.UUID, override_get_current_user: None
) -> None:
    """Test deleting a note."""
    note = await Note.create(user_id=mock_user_id, title="Note to Delete", content="Content")

    response = await async_client.delete(f"/api/v1/productivity/notes/{note.id}")
    assert response.status_code == 204

    # Verify it's gone
    assert await Note.filter(id=note.id).count() == 0
