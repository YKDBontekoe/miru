from __future__ import annotations

from uuid import UUID

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from app.domain.productivity.models import NoteCreate, TaskCreate, TaskUpdate
from app.domain.productivity.service import ProductivityService


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
        tasks = await ProductivityService.list_tasks(user_id=self.user_id)

        if not tasks:
            return "No tasks found."

        result = "Tasks:\n"
        for t in tasks:
            status = "Completed" if t.is_completed else "Pending"
            result += f"- [{t.id}] {t.title} ({status})\n"
            if t.description:
                result += f"  Description: {t.description}\n"
        return result


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
        task_data = TaskCreate(title=title, description=description, is_completed=False)
        task = await ProductivityService.create_task(user_id=self.user_id, task_data=task_data)

        return f"Successfully created task '{task.title}' with ID {task.id}."


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
        update_data = TaskUpdate(is_completed=is_completed, title=title)
        task = await ProductivityService.update_task(
            user_id=self.user_id, task_id=task_id, update_data=update_data
        )

        status = "Completed" if task.is_completed else "Pending"
        return (
            f"Successfully updated task '{task.title}' with ID {task.id}. Status is now: {status}."
        )


class ListNotesInput(BaseModel):
    pass


class ListNotesTool(BaseTool):
    """Tool to list all notes for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose notes are being listed.
        agent_id: The unique identifier of the agent listing the notes.
    """

    name: str = "List Notes Tool"
    description: str = "Lists all notes for the user. Useful to check what the user has noted."
    args_schema: type[BaseModel] = ListNotesInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self) -> str:
        notes = await ProductivityService.list_notes(user_id=self.user_id)

        if not notes:
            return "No notes found."

        result = "Notes:\n"
        for n in notes:
            pinned = "(Pinned)" if n.is_pinned else ""
            result += f"- [{n.id}] {pinned} {n.title}\n"
            result += f"  Content: {n.content}\n"
        return result


class CreateNoteInput(BaseModel):
    title: str = Field(..., description="The title of the note.")
    content: str = Field(..., description="The content of the note.")
    origin_context: str | None = Field(
        None, description="A short description of why this note is being created."
    )


class CreateNoteTool(BaseTool):
    """Tool to create a new note for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user for whom the note is being created.
        agent_id: The unique identifier of the agent creating the note.
        origin_message_id: The unique identifier of the message that triggered the note creation.
    """

    name: str = "Create Note Tool"
    description: str = "Creates a new note for the user."
    args_schema: type[BaseModel] = CreateNoteInput
    user_id: UUID
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None

    async def _run(self, title: str, content: str, origin_context: str | None = None) -> str:
        note_data = NoteCreate(
            title=title,
            content=content,
            is_pinned=False,
            agent_id=self.agent_id,
            origin_message_id=self.origin_message_id,
            origin_context=origin_context,
        )
        note = await ProductivityService.create_note(user_id=self.user_id, note_data=note_data)

        return f"Successfully created note '{note.title}' with ID {note.id}."
