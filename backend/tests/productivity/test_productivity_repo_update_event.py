import uuid

import pytest

from app.infrastructure.repositories.productivity_repo import ProductivityRepository


@pytest.mark.asyncio
async def test_update_event_returns_none(initialize_tortoise):
    repo = ProductivityRepository()
    result = await repo.update_event(uuid.uuid4(), uuid.uuid4(), {"title": "Test"})
    assert result is None
