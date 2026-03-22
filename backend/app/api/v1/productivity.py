"""API endpoints for productivity domain (Tasks and Notes)."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security.auth import CurrentUser
from app.domain.productivity.models import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.domain.productivity.use_cases.manage_productivity import (
    CalendarEventNotFoundError,
    InvalidTimeRangeError,
    ManageProductivityUseCase,
    NoteNotFoundError,
    TaskNotFoundError,
)
from app.infrastructure.repositories.productivity_repo import ProductivityRepository

logger = logging.getLogger(__name__)

router = APIRouter(tags=["productivity"])


def get_productivity_use_case() -> ManageProductivityUseCase:
    """Dependency injection for the productivity use case."""
    # Instantiating the concrete repository here keeps the framework route
    # as the composition root, wiring dependencies for the use case.
    repository = ProductivityRepository()
    return ManageProductivityUseCase(repository=repository)


ProductivityUseCaseDep = Annotated[ManageProductivityUseCase, Depends(get_productivity_use_case)]


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


@router.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    task_data: TaskCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> TaskResponse:
    """Create a new task."""
    task = await use_case.create_task(user_id, task_data)
    # The TaskResponse model_validate method handles the conversion
    # from the pure TaskEntity to the Pydantic TaskResponse schema.
    return TaskResponse.model_validate(task)


@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[TaskResponse]:
    """List all tasks for the current user."""
    tasks = await use_case.list_tasks(user_id, limit=limit, offset=offset)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> TaskResponse:
    """Get a specific task."""
    try:
        task = await use_case.get_task(user_id, task_id)
        return TaskResponse.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(status_code=404, detail="Task not found") from None


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> TaskResponse:
    """Update a specific task."""
    try:
        task = await use_case.update_task(user_id, task_id, task_data)
        return TaskResponse.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(status_code=404, detail="Task not found") from None


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> None:
    """Delete a specific task."""
    try:
        await use_case.delete_task(user_id, task_id)
    except TaskNotFoundError:
        raise HTTPException(status_code=404, detail="Task not found") from None


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------


@router.post("/notes", response_model=NoteResponse, status_code=201)
async def create_note(
    note_data: NoteCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> NoteResponse:
    """Create a new note."""
    note = await use_case.create_note(user_id, note_data)
    return NoteResponse.model_validate(note)


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[NoteResponse]:
    """List all notes for the current user."""
    notes = await use_case.list_notes(user_id, limit=limit, offset=offset)
    return [NoteResponse.model_validate(n) for n in notes]


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> NoteResponse:
    """Get a specific note."""
    try:
        note = await use_case.get_note(user_id, note_id)
        return NoteResponse.model_validate(note)
    except NoteNotFoundError:
        raise HTTPException(status_code=404, detail="Note not found") from None


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> NoteResponse:
    """Update a specific note."""
    try:
        note = await use_case.update_note(user_id, note_id, note_data)
        return NoteResponse.model_validate(note)
    except NoteNotFoundError:
        raise HTTPException(status_code=404, detail="Note not found") from None


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> None:
    """Delete a specific note."""
    try:
        await use_case.delete_note(user_id, note_id)
    except NoteNotFoundError:
        raise HTTPException(status_code=404, detail="Note not found") from None


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------


@router.post("/events", response_model=CalendarEventResponse, status_code=201)
async def create_event(
    event_data: CalendarEventCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> CalendarEventResponse:
    """Create a new calendar event."""
    try:
        event = await use_case.create_event(user_id, event_data)
        return CalendarEventResponse.model_validate(event)
    except InvalidTimeRangeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/events", response_model=list[CalendarEventResponse])
async def list_events(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[CalendarEventResponse]:
    """List all calendar events for the current user."""
    events = await use_case.list_events(user_id, limit=limit, offset=offset)
    return [CalendarEventResponse.model_validate(e) for e in events]


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_event(
    event_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> CalendarEventResponse:
    """Get a specific calendar event."""
    try:
        event = await use_case.get_event(user_id, event_id)
        return CalendarEventResponse.model_validate(event)
    except CalendarEventNotFoundError:
        raise HTTPException(status_code=404, detail="Calendar event not found") from None


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: UUID,
    event_data: CalendarEventUpdate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> CalendarEventResponse:
    """Update a specific calendar event."""
    try:
        event = await use_case.update_event(user_id, event_id, event_data)
        return CalendarEventResponse.model_validate(event)
    except CalendarEventNotFoundError:
        raise HTTPException(status_code=404, detail="Calendar event not found") from None
    except InvalidTimeRangeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> None:
    """Delete a specific calendar event."""
    try:
        await use_case.delete_event(user_id, event_id)
    except CalendarEventNotFoundError:
        raise HTTPException(status_code=404, detail="Calendar event not found") from None
