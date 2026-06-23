import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_event_not_found(async_client: AsyncClient, override_get_current_user):
    non_existent_event_id = uuid.uuid4()
    response = await async_client.patch(
        f"/api/v1/productivity/events/{non_existent_event_id}", json={"title": "Updated Event"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_task_not_found(async_client: AsyncClient, override_get_current_user):
    non_existent_task_id = uuid.uuid4()
    response = await async_client.patch(
        f"/api/v1/productivity/tasks/{non_existent_task_id}", json={"title": "Updated Task"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_note_not_found(async_client: AsyncClient, override_get_current_user):
    non_existent_note_id = uuid.uuid4()
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{non_existent_note_id}", json={"title": "Updated Note"}
    )
    assert response.status_code == 404
