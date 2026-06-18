import uuid
import pytest
from app.infrastructure.repositories.productivity_repo import ProductivityRepository

@pytest.mark.asyncio
async def test_update_task_returns_none(initialize_tortoise):
    repo = ProductivityRepository()
    result = await repo.update_task(uuid.uuid4(), uuid.uuid4(), {"title": "Test"})
    assert result is None

@pytest.mark.asyncio
async def test_update_note_returns_none(initialize_tortoise):
    repo = ProductivityRepository()
    result = await repo.update_note(uuid.uuid4(), uuid.uuid4(), {"title": "Test"})
    assert result is None
