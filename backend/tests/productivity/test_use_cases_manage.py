import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.domain.productivity.interfaces.repository import IProductivityRepository
from app.domain.productivity.schemas import (
    CalendarEventCreate,
    CalendarEventUpdate,
    NoteUpdate,
    TaskUpdate,
)
from app.domain.productivity.use_cases.manage_productivity import (
    CalendarEventNotFoundError,
    InvalidTimeRangeError,
    ManageProductivityUseCase,
    NoteNotFoundError,
    TaskNotFoundError,
)


@pytest.fixture
def mock_repo():
    repo = MagicMock(spec=IProductivityRepository)
    repo.update_task = AsyncMock(return_value=None)
    repo.update_note = AsyncMock(return_value=None)
    repo.update_event = AsyncMock(return_value=None)

    mock_task = MagicMock()
    mock_task.title = "Task"
    mock_task.is_completed = False
    repo.get_task = AsyncMock(return_value=mock_task)

    mock_note = MagicMock()
    mock_note.title = "Note"
    mock_note.content = "Content"
    mock_note.is_pinned = False
    repo.get_note = AsyncMock(return_value=mock_note)

    now = datetime.now(UTC)
    mock_event = MagicMock()
    mock_event.start_time = now
    mock_event.end_time = now + timedelta(hours=1)
    repo.get_event = AsyncMock(return_value=mock_event)

    return repo


@pytest.mark.asyncio
async def test_manage_productivity_not_found_on_update(mock_repo):
    use_case = ManageProductivityUseCase(mock_repo)
    user_id = uuid.uuid4()

    with pytest.raises(TaskNotFoundError):
        await use_case.update_task(user_id, uuid.uuid4(), TaskUpdate(title="New"))

    with pytest.raises(NoteNotFoundError):
        await use_case.update_note(user_id, uuid.uuid4(), NoteUpdate(title="New"))

    with pytest.raises(CalendarEventNotFoundError):
        await use_case.update_event(user_id, uuid.uuid4(), CalendarEventUpdate(title="New"))

    # Test update with no valid fields returns the original entity
    task_res = await use_case.update_task(user_id, uuid.uuid4(), TaskUpdate())
    assert task_res == mock_repo.get_task.return_value

    note_res = await use_case.update_note(user_id, uuid.uuid4(), NoteUpdate())
    assert note_res == mock_repo.get_note.return_value

    event_res = await use_case.update_event(user_id, uuid.uuid4(), CalendarEventUpdate())
    assert event_res == mock_repo.get_event.return_value


@pytest.mark.asyncio
async def test_create_event_invalid_time(mock_repo):
    use_case = ManageProductivityUseCase(mock_repo)
    user_id = uuid.uuid4()
    now = datetime.now(UTC)
    event_data = MagicMock(spec=CalendarEventCreate)
    event_data.start_time = now
    event_data.end_time = now - timedelta(hours=1)
    with pytest.raises(InvalidTimeRangeError):
        await use_case.create_event(user_id, event_data)


@pytest.mark.asyncio
async def test_update_event_invalid_time(mock_repo):
    use_case = ManageProductivityUseCase(mock_repo)
    user_id = uuid.uuid4()
    now = datetime.now(UTC)

    mock_event = MagicMock()
    mock_event.start_time = now
    mock_event.end_time = now + timedelta(hours=1)
    mock_repo.get_event = AsyncMock(return_value=mock_event)

    with pytest.raises(InvalidTimeRangeError):
        await use_case.update_event(
            user_id, uuid.uuid4(), CalendarEventUpdate(end_time=now - timedelta(hours=1))
        )
