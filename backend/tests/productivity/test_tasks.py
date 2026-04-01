from __future__ import annotations

import uuid

import pytest

from app.domain.productivity.models import Task


@pytest.mark.asyncio
async def test_create_task(async_client, override_get_current_user):
    response = await async_client.post(
        "/api/v1/productivity/tasks", json={"title": "Test Task", "description": "Test Description"}
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Test Task"


@pytest.mark.asyncio
async def test_create_task_invalid_title(async_client, override_get_current_user):
    response = await async_client.post(
        "/api/v1/productivity/tasks", json={"title": "a" * 256, "description": "Test Description"}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_tasks(async_client, mock_user_id, another_user_id, override_get_current_user):
    import datetime

    due_date = datetime.datetime(2026, 12, 31, tzinfo=datetime.UTC)
    await Task.create(user_id=mock_user_id, title="Task 1", due_date=due_date)
    await Task.create(user_id=mock_user_id, title="Task 2")
    await Task.create(user_id=another_user_id, title="Other User Task")

    response = await async_client.get("/api/v1/productivity/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_create_task_with_due_date(async_client, override_get_current_user):
    response = await async_client.post(
        "/api/v1/productivity/tasks",
        json={"title": "Timed Task", "due_date": "2026-12-31T00:00:00Z"},
    )
    assert response.status_code == 201
    assert response.json()["due_date"] is not None


@pytest.mark.asyncio
async def test_update_task_due_date(async_client, mock_user_id, override_get_current_user):
    task = await Task.create(user_id=mock_user_id, title="Task With Due Date")
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}", json={"due_date": "2026-06-01T00:00:00Z"}
    )
    assert response.status_code == 200
    assert response.json()["due_date"] is not None
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}", json={"due_date": None}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_task(async_client, mock_user_id, override_get_current_user):
    task = await Task.create(user_id=mock_user_id, title="Original Task")
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}",
        json={"title": "Updated Task", "is_completed": True},
    )
    assert response.status_code == 200
    response = await async_client.patch(f"/api/v1/productivity/tasks/{task.id}", json={})
    assert response.status_code == 200
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}", json={"title": None, "is_completed": None}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_task_not_found_or_forbidden(
    async_client, another_user_id, override_get_current_user
):
    task = await Task.create(user_id=another_user_id, title="Not my task")
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{task.id}", json={"title": "Trying to update"}
    )
    assert response.status_code == 404
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{uuid.uuid4()}", json={"title": "Does not exist"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task(async_client, mock_user_id, override_get_current_user):
    task = await Task.create(user_id=mock_user_id, title="Task to Delete")
    response = await async_client.delete(f"/api/v1/productivity/tasks/{task.id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_task_not_found_or_forbidden(
    async_client, another_user_id, override_get_current_user
):
    task = await Task.create(user_id=another_user_id, title="Not my task")
    response = await async_client.delete(f"/api/v1/productivity/tasks/{task.id}")
    assert response.status_code == 404
    response = await async_client.delete(f"/api/v1/productivity/tasks/{uuid.uuid4()}")
    assert response.status_code == 404
