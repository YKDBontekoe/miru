import uuid
import pytest
from app.domain.productivity.use_cases.manage_productivity import ManageProductivityUseCase
from app.domain.productivity.schemas import TaskUpdate, NoteUpdate, CalendarEventUpdate
from app.domain.productivity.entities import TaskEntity, NoteEntity, CalendarEventEntity
from unittest.mock import AsyncMock, MagicMock
import datetime

@pytest.fixture
def use_case():
    repo = AsyncMock()
    return ManageProductivityUseCase(repo)

@pytest.mark.asyncio
async def test_update_task_no_valid_keys(use_case):
    task_id = uuid.uuid4()
    user_id = uuid.uuid4()
    task = TaskEntity(
        id=task_id,
        user_id=user_id,
        title="Test",
        description="Desc",
        is_completed=False,
        due_date=None,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        deleted_at=None
    )
    use_case._repo.get_task.return_value = task

    # Empty update data
    update_data = TaskUpdate()
    result = await use_case.update_task(user_id, task_id, update_data)
    assert result == task

@pytest.mark.asyncio
async def test_update_note_no_valid_keys(use_case):
    note_id = uuid.uuid4()
    user_id = uuid.uuid4()
    note = NoteEntity(
        id=note_id,
        user_id=user_id,
        title="Test",
        content="Content",
        is_pinned=False,
        agent_id=None,
        origin_message_id=None,
        origin_context=None,
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        deleted_at=None
    )
    use_case._repo.get_note.return_value = note

    update_data = NoteUpdate()
    result = await use_case.update_note(user_id, note_id, update_data)
    assert result == note

@pytest.mark.asyncio
async def test_update_event_no_valid_keys(use_case):
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()
    now = datetime.datetime.now()
    event = CalendarEventEntity(
        id=event_id,
        user_id=user_id,
        title="Test",
        description=None,
        start_time=now,
        end_time=now + datetime.timedelta(hours=1),
        is_all_day=False,
        location=None,
        agent_id=None,
        origin_message_id=None,
        origin_context=None,
        created_at=now,
        updated_at=now,
        deleted_at=None
    )
    use_case._repo.get_event.return_value = event

    update_data = CalendarEventUpdate()
    result = await use_case.update_event(user_id, event_id, update_data)
    assert result == event
