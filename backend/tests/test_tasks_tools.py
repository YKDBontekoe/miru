from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.domain.agent_tools.productivity.tasks_tools import (CreateTaskTool,
                                                             ListTasksTool,
                                                             UpdateTaskTool)
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
    result = await tool._run(title="New Task", description="Some desc")

    assert f"Successfully created task 'New Task' with ID {task_id}." in result


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
    result = await tool._run(task_id=task_id, is_completed=True, title="Updated Task")

    assert f"Successfully updated task '{mock_task.title}' with ID {task_id}." in result


@pytest.mark.asyncio
async def test_update_task_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.update_task = AsyncMock(side_effect=Exception("DB Error"))
    tool = UpdateTaskTool(user_id=uuid4())
    result = await tool._run(task_id=uuid4(), is_completed=True)
    assert "Error updating task." in result
