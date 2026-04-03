"""API endpoints for calendar events."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.errors import raise_api_error
from app.core.security.auth import CurrentUser
from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.schemas import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
)
from app.domain.productivity.use_cases.manage_productivity import (
    CalendarEventNotFoundError,
    InvalidTimeRangeError,
    ManageProductivityUseCase,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["calendar_events"])

ProductivityUseCaseDep = Annotated[ManageProductivityUseCase, Depends(get_productivity_use_case)]


@router.post(
    "/events",
    response_model=CalendarEventResponse,
    status_code=201,
    summary="Create calendar event",
    description="Create a new calendar event for the current user. Requires authentication.",
    responses={
        201: {"description": "Event created successfully."},
        400: {"description": "Invalid time range"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
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
        raise_api_error(status_code=400, error="invalid_time_range", message=str(e))


@router.get(
    "/events",
    response_model=list[CalendarEventResponse],
    summary="List calendar events",
    description="Retrieve all calendar events for the current user. Requires authentication.",
    responses={
        200: {"description": "Events retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_events(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[CalendarEventResponse]:
    """List all calendar events for the current user."""
    events = await use_case.list_events(user_id, limit=limit, offset=offset)
    return [CalendarEventResponse.model_validate(e) for e in events]


@router.get(
    "/events/{event_id}",
    response_model=CalendarEventResponse,
    summary="Get calendar event",
    description="Retrieve a specific calendar event by ID. Requires authentication.",
    responses={
        200: {"description": "Event retrieved successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Event not found"},
        422: {"description": "Validation Error"},
    },
)
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
        raise_api_error(
            status_code=404,
            error="calendar_event_not_found",
            message="Calendar event not found.",
        )


@router.patch(
    "/events/{event_id}",
    response_model=CalendarEventResponse,
    summary="Update calendar event",
    description="Update a specific calendar event by ID. Requires authentication.",
    responses={
        200: {"description": "Event updated successfully."},
        400: {"description": "Invalid time range"},
        401: {"description": "Authentication required"},
        404: {"description": "Event not found"},
        422: {"description": "Validation Error"},
    },
)
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
        raise_api_error(
            status_code=404,
            error="calendar_event_not_found",
            message="Calendar event not found.",
        )
    except InvalidTimeRangeError as e:
        raise_api_error(status_code=400, error="invalid_time_range", message=str(e))


@router.delete(
    "/events/{event_id}",
    status_code=204,
    summary="Delete calendar event",
    description="Delete an existing calendar event. Requires authentication.",
    responses={
        204: {"description": "Event deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Event not found"},
        422: {"description": "Validation Error"},
    },
)
async def delete_event(
    event_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> None:
    """Delete a specific calendar event."""
    try:
        await use_case.delete_event(user_id, event_id)
    except CalendarEventNotFoundError:
        raise_api_error(
            status_code=404,
            error="calendar_event_not_found",
            message="Calendar event not found.",
        )
