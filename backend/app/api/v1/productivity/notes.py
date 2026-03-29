"""API endpoints for notes."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security.auth import CurrentUser
from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.schemas import NoteCreate, NoteResponse, NoteUpdate
from app.domain.productivity.use_cases.manage_productivity import (
    ManageProductivityUseCase,
    NoteNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["notes"])

ProductivityUseCaseDep = Annotated[ManageProductivityUseCase, Depends(get_productivity_use_case)]


@router.post(
    "/notes",
    response_model=NoteResponse,
    status_code=201,
    summary="Create note",
    description="Create a new note for the current user. Requires authentication.",
    responses={
        201: {"description": "Note created successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def create_note(
    note_data: NoteCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> NoteResponse:
    """Create a new note."""
    note = await use_case.create_note(user_id, note_data)
    return NoteResponse.model_validate(note)


@router.get(
    "/notes",
    response_model=list[NoteResponse],
    summary="List notes",
    description="Retrieve all notes for the current user. Requires authentication.",
    responses={
        200: {"description": "Notes retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_notes(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[NoteResponse]:
    """List all notes for the current user."""
    notes = await use_case.list_notes(user_id, limit=limit, offset=offset)
    return [NoteResponse.model_validate(n) for n in notes]


@router.get(
    "/notes/{note_id}",
    response_model=NoteResponse,
    summary="Get note",
    description="Retrieve a specific note by ID. Requires authentication.",
    responses={
        200: {"description": "Note retrieved successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Note not found"},
        422: {"description": "Validation Error"},
    },
)
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
        raise HTTPException(
            status_code=404, detail={"error": "note_not_found", "message": "Note not found"}
        ) from None


@router.patch(
    "/notes/{note_id}",
    response_model=NoteResponse,
    summary="Update note",
    description="Update a specific note by ID. Requires authentication.",
    responses={
        200: {"description": "Note updated successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Note not found"},
        422: {"description": "Validation Error"},
    },
)
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
        raise HTTPException(
            status_code=404, detail={"error": "note_not_found", "message": "Note not found"}
        ) from None


@router.delete(
    "/notes/{note_id}",
    status_code=204,
    summary="Delete note",
    description="Delete an existing note. Requires authentication.",
    responses={
        204: {"description": "Note deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Note not found"},
        422: {"description": "Validation Error"},
    },
)
async def delete_note(
    note_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> None:
    """Delete a specific note."""
    try:
        await use_case.delete_note(user_id, note_id)
    except NoteNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "note_not_found", "message": "Note not found"},
        ) from None
