from __future__ import annotations

import logging
from datetime import datetime
from typing import Any
from uuid import UUID

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.use_cases.manage_productivity import (
    CalendarEventNotFoundError,
    InvalidTimeRangeError,
)

logger = logging.getLogger(__name__)


class ListEventsInput(BaseModel):
    pass


class ListEventsTool(BaseTool):
    """Tool to list all calendar events for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose events are being listed.
        agent_id: The unique identifier of the agent listing the events.
    """

    name: str = "List Events Tool"
    description: str = (
        "Lists all calendar events for the user. Useful to check the user's schedule."
    )
    args_schema: type[BaseModel] = ListEventsInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self) -> str:
        try:
            events = await get_productivity_use_case().list_events(user_id=self.user_id)

            if not events:
                return "No calendar events found."

            result = "Calendar Events:\n"
            for e in events:
                if e.is_all_day:
                    if e.end_time.date() != e.start_time.date():
                        time_str = f"All Day {e.start_time.strftime('%Y-%m-%d')} to {e.end_time.strftime('%Y-%m-%d')}"
                    else:
                        time_str = f"All Day on {e.start_time.strftime('%Y-%m-%d')}"
                else:
                    time_str = f"{e.start_time.strftime('%Y-%m-%d %H:%M')} to {e.end_time.strftime('%Y-%m-%d %H:%M')}"
                result += f"- [{e.id}] {e.title} ({time_str})\n"
                if e.description:
                    result += f"  Description: {e.description}\n"
                if e.location:
                    result += f"  Location: {e.location}\n"
            return result
        except Exception:
            logger.exception("Error in ListEventsTool")
            return "Error fetching calendar events."


class CreateEventInput(BaseModel):
    title: str = Field(..., description="The title of the calendar event.")
    description: str | None = Field(None, description="An optional description for the event.")
    start_time: datetime = Field(
        ..., description="The start time of the event (ISO 8601 format, e.g. 2024-05-20T10:00:00Z)."
    )
    end_time: datetime = Field(
        ..., description="The end time of the event (ISO 8601 format, e.g. 2024-05-20T11:00:00Z)."
    )
    is_all_day: bool = Field(False, description="Whether the event is an all-day event.")
    location: str | None = Field(None, description="The location of the event.")
    origin_context: str | None = Field(
        None, description="A short description of why this event is being created."
    )


class CreateEventTool(BaseTool):
    """Tool to create a new calendar event for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user for whom the event is being created.
        agent_id: The unique identifier of the agent creating the event.
        origin_message_id: The unique identifier of the message that triggered the event creation.
    """

    name: str = "Create Event Tool"
    description: str = "Creates a new calendar event for the user."
    args_schema: type[BaseModel] = CreateEventInput
    user_id: UUID
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None

    async def _run(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: str | None = None,
        is_all_day: bool = False,
        location: str | None = None,
        origin_context: str | None = None,
    ) -> str:
        try:
            # We import here to avoid circular imports after refactor
            from app.domain.productivity.schemas import CalendarEventCreate

            event_data = CalendarEventCreate(  # type: ignore[call-arg]
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                is_all_day=is_all_day,
                location=location,
                agent_id=self.agent_id,
                origin_message_id=self.origin_message_id,
                origin_context=origin_context,
            )
            event = await get_productivity_use_case().create_event(
                user_id=self.user_id, event_data=event_data
            )

            return f"Successfully created calendar event '{event.title}' with ID {event.id}."
        except (CalendarEventNotFoundError, InvalidTimeRangeError):
            raise
        except Exception:
            logger.exception("Error in CreateEventTool")
            return "Error creating calendar event."


class UpdateEventInput(BaseModel):
    event_id: UUID = Field(..., description="The ID of the event to update.")
    title: str | None = Field(None, description="Optional new title.")
    description: str | None = Field(None, description="Optional new description.")
    start_time: datetime | None = Field(None, description="Optional new start time (ISO 8601).")
    end_time: datetime | None = Field(None, description="Optional new end time (ISO 8601).")
    is_all_day: bool | None = Field(None, description="Optional new all-day status.")
    location: str | None = Field(None, description="Optional new location.")


class UpdateEventTool(BaseTool):
    """Tool to update an existing calendar event for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose event is being updated.
        agent_id: The unique identifier of the agent updating the event.
    """

    name: str = "Update Event Tool"
    description: str = "Updates a calendar event for the user."
    args_schema: type[BaseModel] = UpdateEventInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(
        self,
        event_id: UUID,
        title: str | None = None,
        description: str | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        is_all_day: bool | None = None,
        location: str | None = None,
    ) -> str:
        try:
            from app.domain.productivity.schemas import CalendarEventUpdate

            update_fields: dict[str, Any] = {}
            if title is not None:
                update_fields["title"] = title
            if description is not None:
                update_fields["description"] = description
            if start_time is not None:
                update_fields["start_time"] = start_time
            if end_time is not None:
                update_fields["end_time"] = end_time
            if is_all_day is not None:
                update_fields["is_all_day"] = is_all_day
            if location is not None:
                update_fields["location"] = location

            update_data = CalendarEventUpdate(**update_fields)

            event = await get_productivity_use_case().update_event(
                user_id=self.user_id, event_id=event_id, update_data=update_data
            )

            return f"Successfully updated calendar event '{event.title}' with ID {event.id}."
        except (CalendarEventNotFoundError, InvalidTimeRangeError):
            raise
        except Exception:
            logger.exception("Error in UpdateEventTool")
            return "Error updating calendar event."


class DeleteEventInput(BaseModel):
    event_id: UUID = Field(..., description="The ID of the calendar event to delete.")


class DeleteEventTool(BaseTool):
    """Tool to delete an existing calendar event for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose event is being deleted.
        agent_id: The unique identifier of the agent deleting the event.
    """

    name: str = "Delete Event Tool"
    description: str = "Deletes a calendar event for the user."
    args_schema: type[BaseModel] = DeleteEventInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self, event_id: UUID) -> str:
        try:
            await get_productivity_use_case().delete_event(user_id=self.user_id, event_id=event_id)
            return f"Successfully deleted calendar event with ID {event_id}."
        except (CalendarEventNotFoundError, InvalidTimeRangeError):
            raise
        except Exception:
            logger.exception("Error in DeleteEventTool")
            return "Error deleting calendar event."
