"""Repository interface for productivity domain."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.productivity.entities import CalendarEventEntity, NoteEntity, TaskEntity
from app.domain.productivity.schemas import CalendarEventCreate, NoteCreate, TaskCreate


class IProductivityRepository(Protocol):
    """Protocol defining the repository operations for the productivity domain."""

    async def create_task(self, user_id: UUID, task_data: TaskCreate) -> TaskEntity:
        """Create a new task.

        Args:
            user_id: The ID of the user creating the task.
            task_data: The task details.

        Returns:
            TaskEntity: The created task.
        """
        ...

    async def list_tasks(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[TaskEntity]:
        """List tasks for a user.

        Args:
            user_id: The ID of the user.
            limit: Maximum number of tasks to return.
            offset: Number of tasks to skip.

        Returns:
            list[TaskEntity]: The list of tasks.
        """
        ...

    async def get_task(self, user_id: UUID, task_id: UUID) -> TaskEntity | None:
        """Get a specific task.

        Args:
            user_id: The ID of the user.
            task_id: The ID of the task.

        Returns:
            TaskEntity | None: The task entity if found, otherwise None.
        """
        ...

    async def update_task(
        self, user_id: UUID, task_id: UUID, valid_keys: dict
    ) -> TaskEntity | None:
        """Update a specific task.

        Args:
            user_id: The ID of the user.
            task_id: The ID of the task.
            valid_keys: Dictionary of fields to update.

        Returns:
            TaskEntity | None: The updated task entity if found, otherwise None.
        """
        ...

    async def delete_task(self, user_id: UUID, task_id: UUID) -> int:
        """Delete a specific task.

        Args:
            user_id: The ID of the user.
            task_id: The ID of the task.

        Returns:
            int: The number of deleted records.
        """
        ...

    async def create_note(self, user_id: UUID, note_data: NoteCreate) -> NoteEntity:
        """Create a new note.

        Args:
            user_id: The ID of the user creating the note.
            note_data: The note details.

        Returns:
            NoteEntity: The created note.
        """
        ...

    async def list_notes(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[NoteEntity]:
        """List notes for a user.

        Args:
            user_id: The ID of the user.
            limit: Maximum number of notes to return.
            offset: Number of notes to skip.

        Returns:
            list[NoteEntity]: The list of notes.
        """
        ...

    async def get_note(self, user_id: UUID, note_id: UUID) -> NoteEntity | None:
        """Get a specific note.

        Args:
            user_id: The ID of the user.
            note_id: The ID of the note.

        Returns:
            NoteEntity | None: The note entity if found, otherwise None.
        """
        ...

    async def update_note(
        self, user_id: UUID, note_id: UUID, valid_keys: dict
    ) -> NoteEntity | None:
        """Update a specific note.

        Args:
            user_id: The ID of the user.
            note_id: The ID of the note.
            valid_keys: Dictionary of fields to update.

        Returns:
            NoteEntity | None: The updated note entity if found, otherwise None.
        """
        ...

    async def delete_note(self, user_id: UUID, note_id: UUID) -> int:
        """Delete a specific note.

        Args:
            user_id: The ID of the user.
            note_id: The ID of the note.

        Returns:
            int: The number of deleted records.
        """
        ...

    async def create_event(
        self, user_id: UUID, event_data: CalendarEventCreate
    ) -> CalendarEventEntity:
        """Create a new calendar event.

        Args:
            user_id: The ID of the user creating the event.
            event_data: The event details.

        Returns:
            CalendarEventEntity: The created event.
        """
        ...

    async def list_events(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[CalendarEventEntity]:
        """List calendar events for a user.

        Args:
            user_id: The ID of the user.
            limit: Maximum number of events to return.
            offset: Number of events to skip.

        Returns:
            list[CalendarEventEntity]: The list of events.
        """
        ...

    async def get_event(self, user_id: UUID, event_id: UUID) -> CalendarEventEntity | None:
        """Get a specific calendar event.

        Args:
            user_id: The ID of the user.
            event_id: The ID of the event.

        Returns:
            CalendarEventEntity | None: The event entity if found, otherwise None.
        """
        ...

    async def update_event(
        self, user_id: UUID, event_id: UUID, valid_keys: dict
    ) -> CalendarEventEntity | None:
        """Update a specific calendar event.

        Args:
            user_id: The ID of the user.
            event_id: The ID of the event.
            valid_keys: Dictionary of fields to update.

        Returns:
            CalendarEventEntity | None: The updated event entity if found, otherwise None.
        """
        ...

    async def delete_event(self, user_id: UUID, event_id: UUID) -> int:
        """Delete a specific calendar event.

        Args:
            user_id: The ID of the user.
            event_id: The ID of the event.

        Returns:
            int: The number of deleted records.
        """
        ...
