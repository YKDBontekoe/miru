"""API endpoints for productivity domain (Tasks and Notes)."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security.auth import CurrentUser
from app.domain.productivity.dependencies import get_productivity_use_case
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

logger = logging.getLogger(__name__)

router = APIRouter(tags=["productivity"])


ProductivityUseCaseDep = Annotated[ManageProductivityUseCase, Depends(get_productivity_use_case)]


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


# DOCS(miru-agent): undocumented endpoint
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


# DOCS(miru-agent): undocumented endpoint


# DOCS(miru-agent): undocumented endpoint
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


# DOCS(miru-agent): undocumented endpoint

# DOCS(miru-agent): undocumented endpoint


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
        raise HTTPException(
            status_code=404,
            detail={"error": "task_not_found", "message": "Task not found"},
            # DOCS(miru-agent): undocumented endpoint
        ) from None


# DOCS(miru-agent): undocumented endpoint


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
        raise HTTPException(
            # DOCS(miru-agent): undocumented endpoint
            status_code=404,
            detail={"error": "task_not_found", "message": "Task not found"},
            # DOCS(miru-agent): undocumented endpoint
        ) from None


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
        raise HTTPException(
            status_code=404, detail={"error": "task_not_found", "message": "Task not found"}
        ) from None


# DOCS(miru-agent): undocumented endpoint
# ---------------------------------------------------------------------------
# DOCS(miru-agent): undocumented endpoint
# Notes
# ---------------------------------------------------------------------------


@router.post("/notes", response_model=NoteResponse, status_code=201)
async def create_note(
    note_data: NoteCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    # DOCS(miru-agent): undocumented endpoint
) -> NoteResponse:
    # DOCS(miru-agent): undocumented endpoint
    """Create a new note."""
    note = await use_case.create_note(user_id, note_data)
    return NoteResponse.model_validate(note)


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    # DOCS(miru-agent): undocumented endpoint
    offset: int = Query(0, ge=0),
    # DOCS(miru-agent): undocumented endpoint
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
        # DOCS(miru-agent): undocumented endpoint
        note = await use_case.get_note(user_id, note_id)
        # DOCS(miru-agent): undocumented endpoint
        return NoteResponse.model_validate(note)
    except NoteNotFoundError:
        raise HTTPException(
            status_code=404, detail={"error": "note_not_found", "message": "Note not found"}
        ) from None


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> NoteResponse:
    """Update a specific note."""
    # DOCS(miru-agent): undocumented endpoint
    try:
        # DOCS(miru-agent): undocumented endpoint
        note = await use_case.update_note(user_id, note_id, note_data)
        return NoteResponse.model_validate(note)
    except NoteNotFoundError:
        raise HTTPException(
            status_code=404, detail={"error": "note_not_found", "message": "Note not found"}
        ) from None


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
        # DOCS(miru-agent): undocumented endpoint
        raise HTTPException(
            # DOCS(miru-agent): undocumented endpoint
            status_code=404,
            detail={"error": "note_not_found", "message": "Note not found"},
        ) from None


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------


@router.post("/events", response_model=CalendarEventResponse, status_code=201)
async def create_event(
    event_data: CalendarEventCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    # DOCS(miru-agent): undocumented endpoint
) -> CalendarEventResponse:
    """Create a new calendar event."""
    try:
        event = await use_case.create_event(user_id, event_data)
        return CalendarEventResponse.model_validate(event)
    except InvalidTimeRangeError as e:
        raise HTTPException(
            status_code=400, detail={"error": "invalid_time_range", "message": str(e)}
        ) from e


# DOCS(miru-agent): undocumented endpoint
@router.get("/events", response_model=list[CalendarEventResponse])
async def list_events(
    # DOCS(miru-agent): undocumented endpoint
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
    # DOCS(miru-agent): undocumented endpoint
    use_case: ProductivityUseCaseDep,
) -> CalendarEventResponse:
    # DOCS(miru-agent): undocumented endpoint
    """Get a specific calendar event."""
    try:
        event = await use_case.get_event(user_id, event_id)
        return CalendarEventResponse.model_validate(event)
    except CalendarEventNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "calendar_event_not_found", "message": "Calendar event not found"},
        ) from None


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: UUID,
    event_data: CalendarEventUpdate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> CalendarEventResponse:
    """Update a specific calendar event."""
    # DOCS(miru-agent): undocumented endpoint
    try:
        event = await use_case.update_event(user_id, event_id, event_data)
        # DOCS(miru-agent): undocumented endpoint
        return CalendarEventResponse.model_validate(event)
    except CalendarEventNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "calendar_event_not_found", "message": "Calendar event not found"},
        ) from None
    except InvalidTimeRangeError as e:
        raise HTTPException(
            status_code=400, detail={"error": "invalid_time_range", "message": str(e)}
        ) from e


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
        raise HTTPException(
            status_code=404,
            detail={"error": "calendar_event_not_found", "message": "Calendar event not found"},
        ) from None
