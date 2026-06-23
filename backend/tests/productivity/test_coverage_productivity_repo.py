import uuid

import pytest


@pytest.fixture
def mock_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.mark.asyncio
async def test_update_event_repo_coverage(mock_user_id, initialize_tortoise):
    from app.infrastructure.repositories.productivity_repo import ProductivityRepository

    repo = ProductivityRepository()
    res = await repo.update_event(
        user_id=mock_user_id, event_id=uuid.uuid4(), valid_keys={"title": "Updated"}
    )
    assert res is None


@pytest.mark.asyncio
async def test_update_task_repo_coverage(mock_user_id, initialize_tortoise):
    from app.infrastructure.repositories.productivity_repo import ProductivityRepository

    repo = ProductivityRepository()
    res = await repo.update_task(
        user_id=mock_user_id, task_id=uuid.uuid4(), valid_keys={"title": "Updated"}
    )
    assert res is None


@pytest.mark.asyncio
async def test_update_note_repo_coverage(mock_user_id, initialize_tortoise):
    from app.infrastructure.repositories.productivity_repo import ProductivityRepository

    repo = ProductivityRepository()
    res = await repo.update_note(
        user_id=mock_user_id, note_id=uuid.uuid4(), valid_keys={"title": "Updated"}
    )
    assert res is None
