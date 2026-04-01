"""Productivity API routers."""

from __future__ import annotations

from app.api.v1.productivity.calendar_events import \
    router as calendar_events_router
from app.api.v1.productivity.notes import router as notes_router
from app.api.v1.productivity.tasks import router as tasks_router
from fastapi import APIRouter

router = APIRouter()

router.include_router(tasks_router)
router.include_router(notes_router)
router.include_router(calendar_events_router)
