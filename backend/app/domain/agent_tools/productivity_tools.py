import asyncio
from uuid import UUID

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from app.domain.productivity.models import NoteCreate, TaskCreate, TaskUpdate
from app.domain.productivity.service import ProductivityService


class ListTasksInput(BaseModel):
    pass


class ListTasksTool(BaseTool):
    name: str = "List Tasks Tool"
    description: str = "Lists all tasks for the user. Useful to check what the user needs to do."
    args_schema: type[BaseModel] = ListTasksInput
    user_id: UUID

    def _run(self) -> str:
        # CrewAI runs _run synchronously by default
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        tasks = loop.run_until_complete(ProductivityService.list_tasks(user_id=self.user_id))
        loop.close()

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
    description: str = Field(None, description="An optional description for the task.")


class CreateTaskTool(BaseTool):
    name: str = "Create Task Tool"
    description: str = "Creates a new task for the user."
    args_schema: type[BaseModel] = CreateTaskInput
    user_id: UUID

    def _run(self, title: str, description: str | None = None) -> str:
        task_data = TaskCreate(title=title, description=description, is_completed=False)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        task = loop.run_until_complete(
            ProductivityService.create_task(user_id=self.user_id, task_data=task_data)
        )
        loop.close()

        return f"Successfully created task '{task.title}' with ID {task.id}."


class UpdateTaskInput(BaseModel):
    task_id: UUID = Field(..., description="The ID of the task to update.")
    is_completed: bool = Field(None, description="Whether the task is completed or not.")
    title: str = Field(None, description="Optional new title.")


class UpdateTaskTool(BaseTool):
    name: str = "Update Task Tool"
    description: str = "Updates a task for the user, usually to mark it as completed."
    args_schema: type[BaseModel] = UpdateTaskInput
    user_id: UUID

    def _run(
        self, task_id: UUID, is_completed: bool | None = None, title: str | None = None
    ) -> str:
        update_data = TaskUpdate(is_completed=is_completed, title=title)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        task = loop.run_until_complete(
            ProductivityService.update_task(
                user_id=self.user_id, task_id=task_id, update_data=update_data
            )
        )
        loop.close()

        status = "Completed" if task.is_completed else "Pending"
        return (
            f"Successfully updated task '{task.title}' with ID {task.id}. Status is now: {status}."
        )


class ListNotesInput(BaseModel):
    pass


class ListNotesTool(BaseTool):
    name: str = "List Notes Tool"
    description: str = "Lists all notes for the user. Useful to check what the user has noted."
    args_schema: type[BaseModel] = ListNotesInput
    user_id: UUID

    def _run(self) -> str:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        notes = loop.run_until_complete(ProductivityService.list_notes(user_id=self.user_id))
        loop.close()

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


class CreateNoteTool(BaseTool):
    name: str = "Create Note Tool"
    description: str = "Creates a new note for the user."
    args_schema: type[BaseModel] = CreateNoteInput
    user_id: UUID

    def _run(self, title: str, content: str) -> str:
        note_data = NoteCreate(title=title, content=content, is_pinned=False)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        note = loop.run_until_complete(
            ProductivityService.create_note(user_id=self.user_id, note_data=note_data)
        )
        loop.close()

        return f"Successfully created note '{note.title}' with ID {note.id}."
