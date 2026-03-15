"""API endpoints for productivity domain (Tasks and Notes)."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Query

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
from app.domain.productivity.service import ProductivityService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["productivity"])

# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


@router.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    task_data: TaskCreate,
    user_id: CurrentUser,
) -> TaskResponse:
    """Create a new task."""
    task = await ProductivityService.create_task(user_id, task_data)
    return TaskResponse.model_validate(task)


@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    user_id: CurrentUser,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[TaskResponse]:
    """List all tasks for the current user."""
    tasks = await ProductivityService.list_tasks(user_id, limit=limit, offset=offset)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    user_id: CurrentUser,
) -> TaskResponse:
    """Get a specific task."""
    task = await ProductivityService.get_task(user_id, task_id)
    return TaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    user_id: CurrentUser,
) -> TaskResponse:
    """Update a specific task."""
    task = await ProductivityService.update_task(user_id, task_id, task_data)
    return TaskResponse.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: UUID,
    user_id: CurrentUser,
) -> None:
    """Delete a specific task."""
    await ProductivityService.delete_task(user_id, task_id)


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------


@router.post("/notes", response_model=NoteResponse, status_code=201)
async def create_note(
    note_data: NoteCreate,
    user_id: CurrentUser,
) -> NoteResponse:
    """Create a new note."""
    note = await ProductivityService.create_note(user_id, note_data)
    return NoteResponse.model_validate(note)


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    user_id: CurrentUser,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[NoteResponse]:
    """List all notes for the current user."""
    notes = await ProductivityService.list_notes(user_id, limit=limit, offset=offset)
    return [NoteResponse.model_validate(n) for n in notes]


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    user_id: CurrentUser,
) -> NoteResponse:
    """Get a specific note."""
    note = await ProductivityService.get_note(user_id, note_id)
    return NoteResponse.model_validate(note)


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    user_id: CurrentUser,
) -> NoteResponse:
    """Update a specific note."""
    note = await ProductivityService.update_note(user_id, note_id, note_data)
    return NoteResponse.model_validate(note)


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: UUID,
    user_id: CurrentUser,
) -> None:
    """Delete a specific note."""
    await ProductivityService.delete_note(user_id, note_id)


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------


@router.post("/events", response_model=CalendarEventResponse, status_code=201)
async def create_event(
    event_data: CalendarEventCreate,
    user_id: CurrentUser,
) -> CalendarEventResponse:
    """Create a new calendar event."""
    event = await ProductivityService.create_event(user_id, event_data)
    return CalendarEventResponse.model_validate(event)


@router.get("/events", response_model=list[CalendarEventResponse])
async def list_events(
    user_id: CurrentUser,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[CalendarEventResponse]:
    """List all calendar events for the current user."""
    events = await ProductivityService.list_events(user_id, limit=limit, offset=offset)
    return [CalendarEventResponse.model_validate(e) for e in events]


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_event(
    event_id: UUID,
    user_id: CurrentUser,
) -> CalendarEventResponse:
    """Get a specific calendar event."""
    event = await ProductivityService.get_event(user_id, event_id)
    return CalendarEventResponse.model_validate(event)


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: UUID,
    event_data: CalendarEventUpdate,
    user_id: CurrentUser,
) -> CalendarEventResponse:
    """Update a specific calendar event."""
    event = await ProductivityService.update_event(user_id, event_id, event_data)
    return CalendarEventResponse.model_validate(event)


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: UUID,
    user_id: CurrentUser,
) -> None:
    """Delete a specific calendar event."""
    await ProductivityService.delete_event(user_id, event_id)
