from __future__ import annotations

import pytest

from app.api.v1.productivity.tasks import create_task, get_task, list_tasks, update_task, delete_task
from app.api.v1.productivity.notes import create_note, get_note, list_notes, update_note, delete_note
from app.api.v1.productivity.calendar_events import create_event, get_event, list_events, update_event, delete_event
from app.domain.productivity.dependencies import get_productivity_use_case

def test_dependencies():
    use_case = get_productivity_use_case()
    assert use_case is not None
