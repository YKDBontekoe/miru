"""Repository implementation for productivity domain using Tortoise ORM."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from app.domain.productivity.entities import CalendarEventEntity, NoteEntity, TaskEntity
from app.domain.productivity.interfaces.repository import IProductivityRepository
from app.domain.productivity.models import (
    CalendarEventCreate,
    NoteCreate,
    TaskCreate,
)
from app.infrastructure.database.models.productivity_models import CalendarEvent, Note, Task
from app.infrastructure.database.utils import handle_db_errors


def _map_task(task: Task) -> TaskEntity:
    return TaskEntity(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        is_completed=task.is_completed,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        deleted_at=task.deleted_at,
    )


def _map_note(note: Note) -> NoteEntity:
    agent_id = (
        _extract_uuid(note.agent_id)
        if hasattr(note, "agent_id")
        else getattr(note, "agent_id", None)
    )
    if not agent_id and getattr(note, "agent", None):
        agent_id = getattr(note.agent, "id", None)

    origin_message_id = (
        _extract_uuid(note.origin_message_id)
        if hasattr(note, "origin_message_id")
        else getattr(note, "origin_message_id", None)
    )
    if not origin_message_id and getattr(note, "origin_message", None):
        origin_message_id = getattr(note.origin_message, "id", None)

    return NoteEntity(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        content=note.content,
        is_pinned=note.is_pinned,
        agent_id=agent_id,
        origin_message_id=origin_message_id,
        origin_context=note.origin_context,
        created_at=note.created_at,
        updated_at=note.updated_at,
        deleted_at=note.deleted_at,
    )


def _map_event(event: CalendarEvent) -> CalendarEventEntity:
    agent_id = (
        _extract_uuid(event.agent_id)
        if hasattr(event, "agent_id")
        else getattr(event, "agent_id", None)
    )
    if not agent_id and getattr(event, "agent", None):
        agent_id = getattr(event.agent, "id", None)

    origin_message_id = (
        _extract_uuid(event.origin_message_id)
        if hasattr(event, "origin_message_id")
        else getattr(event, "origin_message_id", None)
    )
    if not origin_message_id and getattr(event, "origin_message", None):
        origin_message_id = getattr(event.origin_message, "id", None)

    return CalendarEventEntity(
        id=event.id,
        user_id=event.user_id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        is_all_day=event.is_all_day,
        location=event.location,
        agent_id=agent_id,
        origin_message_id=origin_message_id,
        origin_context=event.origin_context,
        created_at=event.created_at,
        updated_at=event.updated_at,
        deleted_at=event.deleted_at,
    )


def _extract_uuid(v: Any) -> UUID | None:
    if v is None:
        return None
    if isinstance(v, UUID):
        return v
    return getattr(v, "pk", None) or getattr(v, "id", None)


class ProductivityRepository(IProductivityRepository):
    """Tortoise ORM implementation of the productivity repository."""

    async def create_task(self, user_id: UUID, task_data: TaskCreate) -> TaskEntity:
        async with handle_db_errors("create task"):
            task = await Task.create(
                user_id=user_id,
                title=task_data.title,
                description=task_data.description,
                is_completed=task_data.is_completed,
                due_date=task_data.due_date,
            )
            return _map_task(task)

    async def list_tasks(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[TaskEntity]:
        async with handle_db_errors("list tasks"):
            tasks = (
                await Task.filter(user_id=user_id)
                .order_by("-created_at")
                .limit(limit)
                .offset(offset)
            )
            return [_map_task(t) for t in tasks]

    async def get_task(self, user_id: UUID, task_id: UUID) -> TaskEntity | None:
        async with handle_db_errors("get task"):
            task = await Task.get_or_none(id=task_id, user_id=user_id)
            if task:
                return _map_task(task)
            return None

    async def update_task(
        self, user_id: UUID, task_id: UUID, valid_keys: dict
    ) -> TaskEntity | None:
        async with handle_db_errors("update task"):
            task = await Task.get_or_none(id=task_id, user_id=user_id)
            if not task:
                return None
            for field, value in valid_keys.items():
                setattr(task, field, value)
            await task.save(update_fields=list(valid_keys.keys()))
            return _map_task(task)

    async def delete_task(self, user_id: UUID, task_id: UUID) -> int:
        async with handle_db_errors("delete task"):
            return await Task.filter(id=task_id, user_id=user_id).delete()

    async def create_note(self, user_id: UUID, note_data: NoteCreate) -> NoteEntity:
        async with handle_db_errors("create note"):
            note = await Note.create(
                user_id=user_id,
                agent_id=note_data.agent_id,
                origin_message_id=note_data.origin_message_id,
                origin_context=note_data.origin_context,
                title=note_data.title,
                content=note_data.content,
                is_pinned=note_data.is_pinned,
            )
            return _map_note(note)

    async def list_notes(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[NoteEntity]:
        async with handle_db_errors("list notes"):
            notes = (
                await Note.filter(user_id=user_id)
                .prefetch_related("agent", "origin_message")
                .order_by("-is_pinned", "-created_at")
                .limit(limit)
                .offset(offset)
            )
            return [_map_note(n) for n in notes]

    async def get_note(self, user_id: UUID, note_id: UUID) -> NoteEntity | None:
        async with handle_db_errors("get note"):
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if note:
                return _map_note(note)
            return None

    async def update_note(
        self, user_id: UUID, note_id: UUID, valid_keys: dict
    ) -> NoteEntity | None:
        async with handle_db_errors("update note"):
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not note:
                return None
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            return _map_note(note)

    async def delete_note(self, user_id: UUID, note_id: UUID) -> int:
        async with handle_db_errors("delete note"):
            return await Note.filter(id=note_id, user_id=user_id).delete()

    async def create_event(
        self, user_id: UUID, event_data: CalendarEventCreate
    ) -> CalendarEventEntity:
        async with handle_db_errors("create calendar event"):
            event = await CalendarEvent.create(
                user_id=user_id,
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
            return _map_event(event)

    async def list_events(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[CalendarEventEntity]:
        async with handle_db_errors("list calendar events"):
            events = (
                await CalendarEvent.filter(user_id=user_id)
                .prefetch_related("agent", "origin_message")
                .order_by("start_time")
                .limit(limit)
                .offset(offset)
            )
            return [_map_event(e) for e in events]

    async def get_event(self, user_id: UUID, event_id: UUID) -> CalendarEventEntity | None:
        async with handle_db_errors("get calendar event"):
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if event:
                return _map_event(event)
            return None

    async def update_event(
        self, user_id: UUID, event_id: UUID, valid_keys: dict
    ) -> CalendarEventEntity:
        async with handle_db_errors("update calendar event"):
            event = await CalendarEvent.get(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            for field, value in valid_keys.items():
                setattr(event, field, value)
            await event.save(update_fields=list(valid_keys.keys()))
            return _map_event(event)

    async def delete_event(self, user_id: UUID, event_id: UUID) -> int:
        async with handle_db_errors("delete calendar event"):
            return await CalendarEvent.filter(id=event_id, user_id=user_id).delete()
