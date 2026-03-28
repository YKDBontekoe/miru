"""Daily brief endpoint — generates a morning digest for the current user."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security.auth import CurrentUser
from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.use_cases.manage_productivity import ManageProductivityUseCase
from app.infrastructure.external.openrouter import structured_completion

logger = logging.getLogger(__name__)

router = APIRouter(tags=["daily-brief"])

ProductivityUseCaseDep = Annotated[ManageProductivityUseCase, Depends(get_productivity_use_case)]


class DailyBriefResponse(BaseModel):
    """Schema for the daily brief response."""

    greeting: str
    summary: str
    upcoming_events: list[str]
    pending_tasks: list[str]
    overdue_tasks: list[str]
    generated_at: datetime


class _BriefContent(BaseModel):
    greeting: str
    summary: str


@router.get(
    "/daily-brief",
    response_model=DailyBriefResponse,
    summary="Daily brief",
    description="Generate a personalised morning digest with upcoming events, tasks, and a summary.",
)
async def get_daily_brief(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> DailyBriefResponse:
    """Return a smart daily brief for the authenticated user."""
    now = datetime.now(UTC)
    tomorrow = now + timedelta(days=1)

    tasks = await use_case.list_tasks(user_id, limit=50)
    events = await use_case.list_events(user_id, limit=50)

    pending = [t for t in tasks if not t.is_completed]
    overdue = [t for t in pending if t.due_date and t.due_date < now]
    upcoming_events = [e for e in events if now <= e.start_time <= tomorrow + timedelta(days=6)]

    pending_titles = [t.title for t in pending[:10]]
    overdue_titles = [t.title for t in overdue[:10]]
    event_descriptions = [
        f"{e.title} at {e.start_time.strftime('%a %b %d %H:%M')}" for e in upcoming_events[:10]
    ]

    context_lines: list[str] = []
    if overdue_titles:
        context_lines.append(f"Overdue tasks: {', '.join(overdue_titles)}")
    if pending_titles:
        context_lines.append(f"Pending tasks: {', '.join(pending_titles)}")
    if event_descriptions:
        context_lines.append(f"Upcoming events: {', '.join(event_descriptions)}")

    context = "\n".join(context_lines) if context_lines else "No tasks or events scheduled."

    try:
        brief = await structured_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a warm and concise personal assistant writing a morning brief. "
                        "Write a short greeting and a 2-3 sentence summary based on the user's "
                        "schedule. Be upbeat and motivating. Keep the summary under 80 words."
                    ),
                },
                {"role": "user", "content": context},
            ],
            response_model=_BriefContent,
        )
        greeting = brief.greeting
        summary = brief.summary
    except Exception:
        logger.warning("Daily brief LLM call failed, using fallback")
        greeting = f"Good {'morning' if now.hour < 12 else 'afternoon'}!"
        summary = (
            f"You have {len(pending)} pending tasks"
            + (f", {len(overdue)} overdue" if overdue else "")
            + f" and {len(upcoming_events)} upcoming events this week."
        )

    return DailyBriefResponse(
        greeting=greeting,
        summary=summary,
        upcoming_events=event_descriptions,
        pending_tasks=pending_titles,
        overdue_tasks=overdue_titles,
        generated_at=now,
    )
