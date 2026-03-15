from __future__ import annotations

import logging
from datetime import datetime
from uuid import UUID

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from app.domain.productivity.models import NoteCreate, TaskCreate, TaskUpdate
from app.domain.productivity.service import ProductivityService

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
            task = await ProductivityService.create_task(user_id=self.user_id, task_data=task_data)

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
            task = await ProductivityService.update_task(
                user_id=self.user_id, task_id=task_id, update_data=update_data
            )

            status = "Completed" if task.is_completed else "Pending"
            return f"Successfully updated task '{task.title}' with ID {task.id}. Status is now: {status}."
        except Exception:
            logger.exception("Error in UpdateTaskTool")
            return "Error updating task."


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
        try:
            notes = await ProductivityService.list_notes(user_id=self.user_id)

            if not notes:
                return "No notes found."

            result = "Notes:\n"
            for n in notes:
                pinned = "(Pinned)" if n.is_pinned else ""
                result += f"- [{n.id}] {pinned} {n.title}\n"
                result += f"  Content: {n.content}\n"
            return result
        except Exception:
            logger.exception("Error in ListNotesTool")
            return "Error fetching notes."


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
        try:
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
        except Exception:
            logger.exception("Error in CreateNoteTool")
            return "Error creating note."


class ListEventsInput(BaseModel):
    pass


class ListEventsTool(BaseTool):
    """Tool to list all calendar events for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose events are being listed.
        agent_id: The unique identifier of the agent listing the events.
    """

    name: str = "List Events Tool"
    description: str = (
        "Lists all calendar events for the user. Useful to check the user's schedule."
    )
    args_schema: type[BaseModel] = ListEventsInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self) -> str:
        try:
            events = await ProductivityService.list_events(user_id=self.user_id)

            if not events:
                return "No calendar events found."

            result = "Calendar Events:\n"
            for e in events:
                time_str = (
                    "All Day"
                    if e.is_all_day
                    else f"{e.start_time.strftime('%Y-%m-%d %H:%M')} to {e.end_time.strftime('%Y-%m-%d %H:%M')}"
                )
                result += f"- [{e.id}] {e.title} ({time_str})\n"
                if e.description:
                    result += f"  Description: {e.description}\n"
                if e.location:
                    result += f"  Location: {e.location}\n"
            return result
        except Exception:
            logger.exception("Error in ListEventsTool")
            return "Error fetching calendar events."


class CreateEventInput(BaseModel):
    title: str = Field(..., description="The title of the calendar event.")
    description: str | None = Field(None, description="An optional description for the event.")
    start_time: datetime = Field(
        ..., description="The start time of the event (ISO 8601 format, e.g. 2024-05-20T10:00:00Z)."
    )
    end_time: datetime = Field(
        ..., description="The end time of the event (ISO 8601 format, e.g. 2024-05-20T11:00:00Z)."
    )
    is_all_day: bool = Field(False, description="Whether the event is an all-day event.")
    location: str | None = Field(None, description="The location of the event.")
    origin_context: str | None = Field(
        None, description="A short description of why this event is being created."
    )


class CreateEventTool(BaseTool):
    """Tool to create a new calendar event for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user for whom the event is being created.
        agent_id: The unique identifier of the agent creating the event.
        origin_message_id: The unique identifier of the message that triggered the event creation.
    """

    name: str = "Create Event Tool"
    description: str = "Creates a new calendar event for the user."
    args_schema: type[BaseModel] = CreateEventInput
    user_id: UUID
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None

    async def _run(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: str | None = None,
        is_all_day: bool = False,
        location: str | None = None,
        origin_context: str | None = None,
    ) -> str:
        try:
            # We import here to avoid circular dependencies if needed, but it's already in models
            from app.domain.productivity.models import CalendarEventCreate

            event_data = CalendarEventCreate(
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                is_all_day=is_all_day,
                location=location,
                agent_id=self.agent_id,
                origin_message_id=self.origin_message_id,
                origin_context=origin_context,
            )
            event = await ProductivityService.create_event(
                user_id=self.user_id, event_data=event_data
            )

            return f"Successfully created calendar event '{event.title}' with ID {event.id}."
        except Exception:
            logger.exception("Error in CreateEventTool")
            return "Error creating calendar event."


class UpdateEventInput(BaseModel):
    event_id: UUID = Field(..., description="The ID of the event to update.")
    title: str | None = Field(None, description="Optional new title.")
    description: str | None = Field(None, description="Optional new description.")
    start_time: datetime | None = Field(None, description="Optional new start time (ISO 8601).")
    end_time: datetime | None = Field(None, description="Optional new end time (ISO 8601).")
    is_all_day: bool | None = Field(None, description="Optional new all-day status.")
    location: str | None = Field(None, description="Optional new location.")


class UpdateEventTool(BaseTool):
    """Tool to update an existing calendar event for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose event is being updated.
        agent_id: The unique identifier of the agent updating the event.
    """

    name: str = "Update Event Tool"
    description: str = "Updates a calendar event for the user."
    args_schema: type[BaseModel] = UpdateEventInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(
        self,
        event_id: UUID,
        title: str | None = None,
        description: str | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        is_all_day: bool | None = None,
        location: str | None = None,
    ) -> str:
        try:
            from app.domain.productivity.models import CalendarEventUpdate

            update_data = CalendarEventUpdate(
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                is_all_day=is_all_day,
                location=location,
            )
            event = await ProductivityService.update_event(
                user_id=self.user_id, event_id=event_id, update_data=update_data
            )

            return f"Successfully updated calendar event '{event.title}' with ID {event.id}."
        except Exception:
            logger.exception("Error in UpdateEventTool")
            return "Error updating calendar event."

class DeleteEventInput(BaseModel):
    event_id: UUID = Field(..., description="The ID of the calendar event to delete.")


class DeleteEventTool(BaseTool):
    """Tool to delete an existing calendar event for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose event is being deleted.
        agent_id: The unique identifier of the agent deleting the event.
    """

    name: str = "Delete Event Tool"
    description: str = "Deletes a calendar event for the user."
    args_schema: type[BaseModel] = DeleteEventInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self, event_id: UUID) -> str:
        try:
            await ProductivityService.delete_event(user_id=self.user_id, event_id=event_id)
            return f"Successfully deleted calendar event with ID {event_id}."
        except Exception:
            logger.exception("Error in DeleteEventTool")
            return "Error deleting calendar event."
