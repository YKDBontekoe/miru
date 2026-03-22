"""Use Cases for productivity domain."""

from __future__ import annotations

import logging
from uuid import UUID

from app.domain.productivity.entities import CalendarEventEntity, NoteEntity, TaskEntity
from app.domain.productivity.interfaces.repository import IProductivityRepository
from app.domain.productivity.models import (
    CalendarEventCreate,
    CalendarEventUpdate,
    NoteCreate,
    NoteUpdate,
    TaskCreate,
    TaskUpdate,
)

logger = logging.getLogger(__name__)


class TaskNotFoundError(Exception):
    pass


class NoteNotFoundError(Exception):
    pass


class CalendarEventNotFoundError(Exception):
    pass


class InvalidTimeRangeError(Exception):
    pass


class ManageProductivityUseCase:
    """Use case for managing productivity entities."""

    def __init__(self, repository: IProductivityRepository):
        self._repo = repository

    # ---------------------------------------------------------------------------
    # Tasks
    # ---------------------------------------------------------------------------

    async def create_task(self, user_id: UUID, task_data: TaskCreate) -> TaskEntity:
        """Create a new task for the user."""
        return await self._repo.create_task(user_id, task_data)

    async def list_tasks(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[TaskEntity]:
        """List tasks for the user with pagination."""
        return await self._repo.list_tasks(user_id, limit, offset)

    async def get_task(self, user_id: UUID, task_id: UUID) -> TaskEntity:
        """Get a specific task."""
        task = await self._repo.get_task(user_id, task_id)
        if not task:
            raise TaskNotFoundError("Task not found")
        return task

    async def update_task(
        self, user_id: UUID, task_id: UUID, update_data: TaskUpdate
    ) -> TaskEntity:
        """Update a specific task."""
        task = await self.get_task(user_id, task_id)

        update_fields = update_data.model_dump(exclude_unset=True)
        if not update_fields:
            return task

        # Filter out None values for non-nullable fields
        valid_keys = {}
        for k, v in update_fields.items():
            if v is None and k in ("title", "is_completed"):
                continue
            valid_keys[k] = v

        if not valid_keys:
            return task

        return await self._repo.update_task(user_id, task_id, valid_keys)

    async def delete_task(self, user_id: UUID, task_id: UUID) -> None:
        """Delete a specific task."""
        # Ensure task exists
        await self.get_task(user_id, task_id)
        await self._repo.delete_task(user_id, task_id)

    # ---------------------------------------------------------------------------
    # Notes
    # ---------------------------------------------------------------------------

    async def create_note(self, user_id: UUID, note_data: NoteCreate) -> NoteEntity:
        """Create a new note for the user."""
        return await self._repo.create_note(user_id, note_data)

    async def list_notes(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[NoteEntity]:
        """List notes for the user, pinned first, then by creation date."""
        return await self._repo.list_notes(user_id, limit, offset)

    async def get_note(self, user_id: UUID, note_id: UUID) -> NoteEntity:
        """Get a specific note."""
        note = await self._repo.get_note(user_id, note_id)
        if not note:
            raise NoteNotFoundError("Note not found")
        return note

    async def update_note(
        self, user_id: UUID, note_id: UUID, update_data: NoteUpdate
    ) -> NoteEntity:
        """Update a specific note."""
        note = await self.get_note(user_id, note_id)

        update_fields = update_data.model_dump(exclude_unset=True)
        if not update_fields:
            return note

        # Filter out None values for non-nullable fields
        valid_keys = {}
        for k, v in update_fields.items():
            if v is None and k in ("title", "content", "is_pinned"):
                continue
            valid_keys[k] = v

        if not valid_keys:
            return note

        return await self._repo.update_note(user_id, note_id, valid_keys)

    async def delete_note(self, user_id: UUID, note_id: UUID) -> None:
        """Delete a specific note."""
        # Ensure note exists
        await self.get_note(user_id, note_id)
        await self._repo.delete_note(user_id, note_id)

    # ---------------------------------------------------------------------------
    # Calendar Events
    # ---------------------------------------------------------------------------

    async def create_event(
        self, user_id: UUID, event_data: CalendarEventCreate
    ) -> CalendarEventEntity:
        """Create a new calendar event for the user."""
        if event_data.end_time <= event_data.start_time:
            logger.warning("Attempted to create event with end_time before start_time")
            raise InvalidTimeRangeError("end_time must be greater than start_time")

        return await self._repo.create_event(user_id, event_data)

    async def list_events(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[CalendarEventEntity]:
        """List calendar events for the user."""
        return await self._repo.list_events(user_id, limit, offset)

    async def get_event(self, user_id: UUID, event_id: UUID) -> CalendarEventEntity:
        """Get a specific calendar event."""
        event = await self._repo.get_event(user_id, event_id)
        if not event:
            raise CalendarEventNotFoundError("Calendar event not found")
        return event

    async def update_event(
        self, user_id: UUID, event_id: UUID, update_data: CalendarEventUpdate
    ) -> CalendarEventEntity:
        """Update a specific calendar event."""
        event = await self.get_event(user_id, event_id)

        update_fields = update_data.model_dump(exclude_unset=True)
        if not update_fields:
            return event

        # Filter out None values for non-nullable fields
        valid_keys = {}
        for k, v in update_fields.items():
            if v is None and k in ("title", "start_time", "end_time", "is_all_day"):
                continue
            valid_keys[k] = v

        if not valid_keys:
            return event

        new_start = valid_keys.get("start_time", event.start_time)
        new_end = valid_keys.get("end_time", event.end_time)

        if new_end <= new_start:
            logger.warning("Attempted to update event with end_time before start_time")
            raise InvalidTimeRangeError("end_time must be greater than start_time")

        return await self._repo.update_event(user_id, event_id, valid_keys)

    async def delete_event(self, user_id: UUID, event_id: UUID) -> None:
        """Delete a specific calendar event."""
        # Ensure event exists
        await self.get_event(user_id, event_id)
        await self._repo.delete_event(user_id, event_id)
