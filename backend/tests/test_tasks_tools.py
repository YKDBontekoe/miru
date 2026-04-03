from __future__ import annotations

from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.agent_tools.productivity.tasks_tools import (
    CreateTaskTool,
    ListTasksTool,
    UpdateTaskTool,
)
from app.domain.productivity.models import Task


@pytest.fixture
def mock_service() -> Generator[MagicMock, None, None]:
    with patch("app.domain.agent_tools.productivity.tasks_tools.get_productivity_use_case") as mock:
        yield mock


@pytest.mark.asyncio
async def test_list_tasks_tool_empty(mock_service: MagicMock) -> None:
    mock_service.return_value.list_tasks = AsyncMock(return_value=[])
    tool = ListTasksTool(user_id=uuid4())
    result = await tool._run()
    assert result == "No tasks found."


@pytest.mark.asyncio
async def test_list_tasks_tool_with_tasks(mock_service: MagicMock) -> None:
    task1 = Task(
        id=uuid4(), title="Task 1", is_completed=False, user_id=uuid4(), description="Desc 1"
    )
    task2 = Task(id=uuid4(), title="Task 2", is_completed=True, user_id=uuid4(), description=None)
    mock_service.return_value.list_tasks = AsyncMock(return_value=[task1, task2])

    tool = ListTasksTool(user_id=uuid4())
    result = await tool._run()

    assert "Tasks:" in result
    assert "Task 1 (Pending)" in result
    assert "Desc 1" in result
    assert "Task 2 (Completed)" in result


@pytest.mark.asyncio
async def test_list_tasks_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.list_tasks = AsyncMock(side_effect=Exception("DB Error"))
    tool = ListTasksTool(user_id=uuid4())
    result = await tool._run()
    assert "Error fetching tasks." in result


@pytest.mark.asyncio
async def test_create_task_tool_success(mock_service: MagicMock) -> None:
    task_id = uuid4()
    mock_task = Task(id=task_id, title="New Task", is_completed=False, user_id=uuid4())
    mock_service.return_value.create_task = AsyncMock(return_value=mock_task)

    tool = CreateTaskTool(user_id=uuid4())
    due_date = datetime(2026, 6, 1, 10, 0, tzinfo=UTC)
    result = await tool._run(title="New Task", description="Some desc", due_date=due_date)

    assert f"Successfully created task 'New Task' with ID {task_id}." in result
    create_call = mock_service.return_value.create_task.await_args
    assert create_call is not None
    created_task_data = create_call.kwargs["task_data"]
    assert created_task_data.due_date == due_date


@pytest.mark.asyncio
async def test_create_task_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.create_task = AsyncMock(side_effect=Exception("DB Error"))
    tool = CreateTaskTool(user_id=uuid4())
    result = await tool._run(title="New Task")
    assert "Error creating task." in result


@pytest.mark.asyncio
async def test_update_task_tool_success(mock_service: MagicMock) -> None:
    task_id = uuid4()
    mock_task = Task(id=task_id, title="Updated Task", is_completed=True, user_id=uuid4())
    mock_service.return_value.update_task = AsyncMock(return_value=mock_task)

    tool = UpdateTaskTool(user_id=uuid4())
    due_date = datetime(2026, 6, 2, 9, 0, tzinfo=UTC)
    result = await tool._run(
        task_id=task_id, is_completed=True, title="Updated Task", due_date=due_date
    )

    assert f"Successfully updated task '{mock_task.title}' with ID {task_id}." in result
    update_call = mock_service.return_value.update_task.await_args
    assert update_call is not None
    update_data = update_call.kwargs["update_data"]
    assert update_data.due_date == due_date


@pytest.mark.asyncio
async def test_update_task_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.update_task = AsyncMock(side_effect=Exception("DB Error"))
    tool = UpdateTaskTool(user_id=uuid4())
    result = await tool._run(task_id=uuid4(), is_completed=True)
    assert "Error updating task." in result
