"""Repository interface for productivity domain."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.productivity.entities import CalendarEventEntity, NoteEntity, TaskEntity
from app.domain.productivity.models import (
    CalendarEventCreate,
    NoteCreate,
    TaskCreate,
)


class IProductivityRepository(Protocol):
    """Protocol defining the repository operations for the productivity domain."""

    async def create_task(self, user_id: UUID, task_data: TaskCreate) -> TaskEntity: ...

    async def list_tasks(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[TaskEntity]: ...

    async def get_task(self, user_id: UUID, task_id: UUID) -> TaskEntity | None: ...

    async def update_task(self, user_id: UUID, task_id: UUID, valid_keys: dict) -> TaskEntity: ...

    async def delete_task(self, user_id: UUID, task_id: UUID) -> None: ...

    async def create_note(self, user_id: UUID, note_data: NoteCreate) -> NoteEntity: ...

    async def list_notes(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[NoteEntity]: ...

    async def get_note(self, user_id: UUID, note_id: UUID) -> NoteEntity | None: ...

    async def update_note(self, user_id: UUID, note_id: UUID, valid_keys: dict) -> NoteEntity: ...

    async def delete_note(self, user_id: UUID, note_id: UUID) -> None: ...

    async def create_event(
        self, user_id: UUID, event_data: CalendarEventCreate
    ) -> CalendarEventEntity: ...

    async def list_events(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[CalendarEventEntity]: ...

    async def get_event(self, user_id: UUID, event_id: UUID) -> CalendarEventEntity | None: ...

    async def update_event(
        self, user_id: UUID, event_id: UUID, valid_keys: dict
    ) -> CalendarEventEntity: ...

    async def delete_event(self, user_id: UUID, event_id: UUID) -> None: ...
