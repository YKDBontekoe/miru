"""Service layer for productivity domain (Tasks and Notes)."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException

from app.domain.productivity.models import (
    CalendarEvent,
    CalendarEventCreate,
    CalendarEventUpdate,
    Note,
    NoteCreate,
    NoteUpdate,
    Task,
    TaskCreate,
    TaskUpdate,
)
from app.infrastructure.database.utils import handle_db_errors

logger = logging.getLogger(__name__)


class ProductivityService:
    """Service for managing productivity features."""

    # ---------------------------------------------------------------------------
    # Tasks
    # ---------------------------------------------------------------------------

    @staticmethod
    async def create_task(user_id: UUID, task_data: TaskCreate) -> Task:
        """Create a new task for the user."""
        async with handle_db_errors("create task"):
            return await Task.create(
                user_id=user_id,
                room_id=task_data.room_id,
                title=task_data.title,
                description=task_data.description,
                is_completed=task_data.is_completed,
            )

    @staticmethod
    async def list_tasks(user_id: UUID, limit: int = 50, offset: int = 0) -> list[Task]:
        """List tasks for the user with pagination."""
        async with handle_db_errors("list tasks"):
            # Justification: Task schema has no related foreign keys (unlike Note or CalendarEvent),
            # so prefetch_related is not needed here to prevent N+1 queries.
            return (
                await Task.filter(user_id=user_id)
                .order_by("-created_at")
                .limit(limit)
                .offset(offset)
            )

    @staticmethod
    async def get_task(user_id: UUID, task_id: UUID) -> Task:
        """Get a specific task."""
        async with handle_db_errors("get task"):
            # Justification: Task schema has no related foreign keys (unlike Note or CalendarEvent),
            # so prefetch_related is not needed here to prevent N+1 queries.
            task = await Task.get_or_none(id=task_id, user_id=user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @staticmethod
    async def update_task(user_id: UUID, task_id: UUID, update_data: TaskUpdate) -> Task:
        """Update a specific task."""
        task = await ProductivityService.get_task(user_id, task_id)

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

        async with handle_db_errors("update task"):
            for field, value in valid_keys.items():
                setattr(task, field, value)
            await task.save(update_fields=list(valid_keys.keys()))
            return task

    @staticmethod
    async def delete_task(user_id: UUID, task_id: UUID) -> None:
        """Delete a specific task."""
        task = await ProductivityService.get_task(user_id, task_id)
        async with handle_db_errors("delete task"):
            await task.delete()

    # ---------------------------------------------------------------------------
    # Notes
    # ---------------------------------------------------------------------------

    @staticmethod
    async def create_note(user_id: UUID, note_data: NoteCreate) -> Note:
        """Create a new note for the user."""
        async with handle_db_errors("create note"):
            return await Note.create(
                user_id=user_id,
                room_id=note_data.room_id,
                agent_id=note_data.agent_id,
                origin_message_id=note_data.origin_message_id,
                origin_context=note_data.origin_context,
                title=note_data.title,
                content=note_data.content,
                is_pinned=note_data.is_pinned,
            )

    @staticmethod
    async def list_notes(user_id: UUID, limit: int = 50, offset: int = 0) -> list[Note]:
        """List notes for the user, pinned first, then by creation date."""
        async with handle_db_errors("list notes"):
            # Justification: Prefetch related agent and origin_message fields to
            # eliminate N+1 queries during Pydantic schema validation.
            return (
                await Note.filter(user_id=user_id)
                .prefetch_related("agent", "origin_message")
                .order_by("-is_pinned", "-created_at")
                .limit(limit)
                .offset(offset)
            )

    @staticmethod
    async def get_note(user_id: UUID, note_id: UUID) -> Note:
        """Get a specific note."""
        async with handle_db_errors("get note"):
            # Justification: Prefetch related agent and origin_message fields to
            # eliminate N+1 queries during Pydantic schema validation.
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return note

    @staticmethod
    async def update_note(user_id: UUID, note_id: UUID, update_data: NoteUpdate) -> Note:
        """Update a specific note."""
        note = await ProductivityService.get_note(user_id, note_id)

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

        async with handle_db_errors("update note"):
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            return note

    @staticmethod
    async def delete_note(user_id: UUID, note_id: UUID) -> None:
        """Delete a specific note."""
        note = await ProductivityService.get_note(user_id, note_id)
        async with handle_db_errors("delete note"):
            await note.delete()

    # ---------------------------------------------------------------------------
    # Calendar Events
    # ---------------------------------------------------------------------------

    @staticmethod
    async def create_event(user_id: UUID, event_data: CalendarEventCreate) -> CalendarEvent:
        """Create a new calendar event for the user."""
        if event_data.end_time <= event_data.start_time:
            logger.warning("Attempted to create event with end_time before start_time")
            raise HTTPException(status_code=400, detail="end_time must be greater than start_time")

        async with handle_db_errors("create calendar event"):
            return await CalendarEvent.create(
                user_id=user_id,
                room_id=event_data.room_id,
                agent_id=event_data.agent_id,
                origin_message_id=event_data.origin_message_id,
                origin_context=event_data.origin_context,
                title=event_data.title,
                description=event_data.description,
                start_time=event_data.start_time,
                end_time=event_data.end_time,
                is_all_day=event_data.is_all_day,
                location=event_data.location,
            )

    @staticmethod
    async def list_events(user_id: UUID, limit: int = 50, offset: int = 0) -> list[CalendarEvent]:
        """List calendar events for the user."""
        async with handle_db_errors("list calendar events"):
            # Justification: Prefetch related agent and origin_message fields to
            # eliminate N+1 queries during Pydantic schema validation.
            return (
                await CalendarEvent.filter(user_id=user_id)
                .prefetch_related("agent", "origin_message")
                .order_by("start_time")
                .limit(limit)
                .offset(offset)
            )

    @staticmethod
    async def get_event(user_id: UUID, event_id: UUID) -> CalendarEvent:
        """Get a specific calendar event."""
        async with handle_db_errors("get calendar event"):
            # Justification: Prefetch related agent and origin_message fields to
            # eliminate N+1 queries during Pydantic schema validation.
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
        if not event:
            raise HTTPException(status_code=404, detail="Calendar event not found")
        return event

    @staticmethod
    async def update_event(
        user_id: UUID, event_id: UUID, update_data: CalendarEventUpdate
    ) -> CalendarEvent:
        """Update a specific calendar event."""
        event = await ProductivityService.get_event(user_id, event_id)

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
            raise HTTPException(status_code=400, detail="end_time must be greater than start_time")

        async with handle_db_errors("update calendar event"):
            for field, value in valid_keys.items():
                setattr(event, field, value)
            await event.save(update_fields=list(valid_keys.keys()))
            return event

    @staticmethod
    async def delete_event(user_id: UUID, event_id: UUID) -> None:
        """Delete a specific calendar event."""
        event = await ProductivityService.get_event(user_id, event_id)
        async with handle_db_errors("delete calendar event"):
            await event.delete()
