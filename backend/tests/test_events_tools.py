from __future__ import annotations

from collections.abc import Generator
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.agent_tools.productivity.events_tools import (
    CreateEventTool,
    DeleteEventTool,
    ListEventsTool,
    UpdateEventTool,
)
from app.domain.productivity.models import CalendarEvent


@pytest.fixture
def mock_service() -> Generator[MagicMock, None, None]:
    with patch(
        "app.domain.agent_tools.productivity.events_tools.ManageProductivityUseCase"
    ) as mock:
        yield mock


@pytest.mark.asyncio
async def test_list_events_tool_empty(mock_service: MagicMock) -> None:
    mock_service.return_value.list_events = AsyncMock(return_value=[])
    tool = ListEventsTool(user_id=uuid4())
    result = await tool._run()
    assert result == "No calendar events found."


@pytest.mark.asyncio
async def test_list_events_tool_with_events(mock_service: MagicMock) -> None:
    event1 = CalendarEvent(
        id=uuid4(),
        title="Event 1",
        start_time=datetime(2025, 1, 1, 10, 0),
        end_time=datetime(2025, 1, 1, 11, 0),
        description="Desc 1",
        is_all_day=False,
        location="Location 1",
        user_id=uuid4(),
    )
    event2 = CalendarEvent(
        id=uuid4(),
        title="Event 2",
        start_time=datetime(2025, 1, 2, 0, 0),
        end_time=datetime(2025, 1, 2, 0, 0),
        description=None,
        is_all_day=True,
        user_id=uuid4(),
    )
    event3 = CalendarEvent(
        id=uuid4(),
        title="Event 3",
        start_time=datetime(2025, 1, 3, 0, 0),
        end_time=datetime(2025, 1, 5, 0, 0),
        description=None,
        is_all_day=True,
        user_id=uuid4(),
    )
    mock_service.return_value.list_events = AsyncMock(return_value=[event1, event2, event3])

    tool = ListEventsTool(user_id=uuid4())
    result = await tool._run()

    assert "Calendar Events:" in result
    assert "Event 1" in result
    assert "2025-01-01 10:00 to 2025-01-01 11:00" in result
    assert "Desc 1" in result
    assert "Location 1" in result
    assert "Event 2" in result
    assert "All Day on 2025-01-02" in result
    assert "Event 3" in result
    assert "All Day 2025-01-03 to 2025-01-05" in result


@pytest.mark.asyncio
async def test_list_events_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.list_events = AsyncMock(side_effect=Exception("DB Error"))
    tool = ListEventsTool(user_id=uuid4())
    result = await tool._run()
    assert "Error fetching calendar events." in result


@pytest.mark.asyncio
async def test_create_event_tool_success(mock_service: MagicMock) -> None:
    event_id = uuid4()
    mock_event = CalendarEvent(
        id=event_id,
        title="New Event",
        start_time=datetime(2025, 1, 1, 10, 0),
        end_time=datetime(2025, 1, 1, 11, 0),
        is_all_day=False,
        user_id=uuid4(),
    )
    mock_service.return_value.create_event = AsyncMock(return_value=mock_event)

    tool = CreateEventTool(user_id=uuid4())
    result = await tool._run(
        title="New Event",
        start_time=datetime(2025, 1, 1, 10, 0),
        end_time=datetime(2025, 1, 1, 11, 0),
        description="Some desc",
        location="Some location",
    )

    assert f"Successfully created calendar event 'New Event' with ID {event_id}." in result


@pytest.mark.asyncio
async def test_create_event_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.create_event = AsyncMock(side_effect=Exception("DB Error"))
    tool = CreateEventTool(user_id=uuid4())
    result = await tool._run(
        title="New Event",
        start_time=datetime(2025, 1, 1, 10, 0),
        end_time=datetime(2025, 1, 1, 11, 0),
    )
    assert "Error creating calendar event." in result


@pytest.mark.asyncio
async def test_update_event_tool_success(mock_service: MagicMock) -> None:
    event_id = uuid4()
    mock_event = CalendarEvent(
        id=event_id,
        title="Updated Event",
        start_time=datetime(2025, 1, 1, 10, 0),
        end_time=datetime(2025, 1, 1, 11, 0),
        is_all_day=False,
        user_id=uuid4(),
    )
    mock_service.return_value.update_event = AsyncMock(return_value=mock_event)

    tool = UpdateEventTool(user_id=uuid4())
    result = await tool._run(
        event_id=event_id,
        title="Updated Event",
        description="New desc",
        location="New loc",
        is_all_day=True,
        start_time=datetime(2025, 1, 1, 10, 0),
        end_time=datetime(2025, 1, 1, 11, 0),
    )

    assert f"Successfully updated calendar event 'Updated Event' with ID {event_id}." in result


@pytest.mark.asyncio
async def test_update_event_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.update_event = AsyncMock(side_effect=Exception("DB Error"))
    tool = UpdateEventTool(user_id=uuid4())
    result = await tool._run(event_id=uuid4(), title="Updated Event")
    assert "Error updating calendar event." in result


@pytest.mark.asyncio
async def test_delete_event_tool_success(mock_service: MagicMock) -> None:
    mock_service.return_value.delete_event = AsyncMock()

    event_id = uuid4()
    tool = DeleteEventTool(user_id=uuid4())
    result = await tool._run(event_id=event_id)

    assert f"Successfully deleted calendar event with ID {event_id}." in result


@pytest.mark.asyncio
async def test_delete_event_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.delete_event = AsyncMock(side_effect=Exception("DB Error"))
    tool = DeleteEventTool(user_id=uuid4())
    result = await tool._run(event_id=uuid4())
    assert "Error deleting calendar event." in result
