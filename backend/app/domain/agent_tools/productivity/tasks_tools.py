from __future__ import annotations

import logging
from uuid import UUID

from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.schemas import TaskCreate, TaskUpdate
from app.domain.productivity.use_cases.manage_productivity import \
    TaskNotFoundError
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ListTasksInput(BaseModel):
    pass


class ListTasksTool(BaseTool):
    """Tool to list all tasks for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose tasks are being listed.
        agent_id: The unique identifier of the agent listing the tasks.
    """

    name: str = "List Tasks Tool"
    description: str = "Lists all tasks for the user. Useful to check what the user needs to do."
    args_schema: type[BaseModel] = ListTasksInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self) -> str:
        try:
            tasks = await get_productivity_use_case().list_tasks(user_id=self.user_id)

            if not tasks:
                return "No tasks found."

            result = "Tasks:\n"
            for t in tasks:
                status = "Completed" if t.is_completed else "Pending"
                result += f"- [{t.id}] {t.title} ({status})\n"
                if t.description:
                    result += f"  Description: {t.description}\n"
            return result
        except Exception:
            logger.exception("Error in ListTasksTool")
            return "Error fetching tasks."


class CreateTaskInput(BaseModel):
    title: str = Field(..., description="The title of the task.")
    description: str | None = Field(None, description="An optional description for the task.")


class CreateTaskTool(BaseTool):
    """Tool to create a new task for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user for whom the task is being created.
        agent_id: The unique identifier of the agent creating the task.
    """

    name: str = "Create Task Tool"
    description: str = "Creates a new task for the user."
    args_schema: type[BaseModel] = CreateTaskInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self, title: str, description: str | None = None) -> str:
        try:
            task_data = TaskCreate(title=title, description=description, is_completed=False)
            task = await get_productivity_use_case().create_task(
                user_id=self.user_id, task_data=task_data
            )

            return f"Successfully created task '{task.title}' with ID {task.id}."
        except Exception:
            logger.exception("Error in CreateTaskTool")
            return "Error creating task."


class UpdateTaskInput(BaseModel):
    task_id: UUID = Field(..., description="The ID of the task to update.")
    is_completed: bool | None = Field(None, description="Whether the task is completed or not.")
    title: str | None = Field(None, description="Optional new title.")


class UpdateTaskTool(BaseTool):
    """Tool to update an existing task for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose task is being updated.
        agent_id: The unique identifier of the agent updating the task.
    """

    name: str = "Update Task Tool"
    description: str = "Updates a task for the user, usually to mark it as completed."
    args_schema: type[BaseModel] = UpdateTaskInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(
        self, task_id: UUID, is_completed: bool | None = None, title: str | None = None
    ) -> str:
        try:
            update_data = TaskUpdate(is_completed=is_completed, title=title)
            task = await get_productivity_use_case().update_task(
                user_id=self.user_id, task_id=task_id, update_data=update_data
            )

            status = "Completed" if task.is_completed else "Pending"
            return f"Successfully updated task '{task.title}' with ID {task.id}. Status is now: {status}."
        except TaskNotFoundError:
            raise
        except Exception:
            logger.exception("Error in UpdateTaskTool")
            return "Error updating task."
