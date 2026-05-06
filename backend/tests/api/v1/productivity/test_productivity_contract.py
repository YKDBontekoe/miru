from __future__ import annotations

import datetime
import uuid
from typing import Any

import pytest
from pydantic import ValidationError

from app.domain.productivity.schemas import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    NoteCreate,
    NoteResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)


def test_task_create_schema_valid():
    data: dict[str, Any] = {
        "title": "Buy groceries",
        "description": "Milk, Eggs, Bread",
        "is_completed": False,
        "due_date": datetime.datetime(2024, 12, 31, 23, 59, 59, tzinfo=datetime.UTC),
    }
    task = TaskCreate(**data)
    assert task.title == "Buy groceries"
    assert task.description == "Milk, Eggs, Bread"
    assert not task.is_completed
    assert task.due_date is not None


def test_task_create_schema_invalid_title():
    with pytest.raises(ValidationError):
        TaskCreate(title="")


def test_task_response_schema():
    data: dict[str, Any] = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "title": "Test",
        "description": None,
        "is_completed": True,
        "due_date": None,
        "created_at": datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
        "updated_at": datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
    }
    task = TaskResponse.model_validate(data)
    assert task.title == "Test"
    assert task.is_completed


def test_note_create_schema_valid():
    data: dict[str, Any] = {
        "title": "Meeting notes",
        "content": "Discussed new project",
        "is_pinned": True,
    }
    note = NoteCreate(**data)
    assert note.title == "Meeting notes"
    assert note.content == "Discussed new project"
    assert note.is_pinned


def test_note_response_schema():
    data: dict[str, Any] = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "agent_id": uuid.uuid4(),
        "origin_message_id": None,
        "origin_context": None,
        "title": "Note 1",
        "content": "Content",
        "is_pinned": False,
        "created_at": datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
        "updated_at": datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
    }
    note = NoteResponse.model_validate(data)
    assert note.title == "Note 1"


def test_calendar_event_create_valid():
    now = datetime.datetime.now(datetime.UTC)
    end = now + datetime.timedelta(hours=1)
    data: dict[str, Any] = {
        "title": "Dentist Appointment",
        "start_time": now,
        "end_time": end,
        "is_all_day": False,
    }
    event = CalendarEventCreate(**data)
    assert event.title == "Dentist Appointment"


def test_calendar_event_create_invalid_time_range():
    now = datetime.datetime.now(datetime.UTC)
    end = now - datetime.timedelta(hours=1)
    data: dict[str, Any] = {
        "title": "Dentist Appointment",
        "start_time": now,
        "end_time": end,
        "is_all_day": False,
    }
    with pytest.raises(ValueError, match="end_time must be greater than start_time"):
        CalendarEventCreate(**data)


def test_calendar_event_response_schema():
    data: dict[str, Any] = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "agent_id": None,
        "origin_message_id": None,
        "origin_context": None,
        "title": "Event 1",
        "description": None,
        "start_time": datetime.datetime(2024, 1, 1, 9, 0, 0, tzinfo=datetime.UTC),
        "end_time": datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=datetime.UTC),
        "is_all_day": False,
        "location": None,
        "created_at": datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
        "updated_at": datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
    }
    event = CalendarEventResponse.model_validate(data)
    assert event.title == "Event 1"


def test_extract_uuid_from_relation_with_id():
    class DummyRelation:
        def __init__(self, obj_id: uuid.UUID):
            self.id = obj_id

    obj_id = uuid.uuid4()
    rel = DummyRelation(obj_id)

    from app.domain.productivity.schemas import extract_uuid_from_relation

    assert extract_uuid_from_relation(rel) == obj_id


def test_extract_uuid_from_relation_with_pk():
    class DummyRelation:
        def __init__(self, obj_id: uuid.UUID):
            self.pk = obj_id

    obj_id = uuid.uuid4()
    rel = DummyRelation(obj_id)

    from app.domain.productivity.schemas import extract_uuid_from_relation

    assert extract_uuid_from_relation(rel) == obj_id


def test_extract_uuid_from_relation_none_or_missing():
    class DummyRelation:
        pass

    rel = DummyRelation()
    from app.domain.productivity.schemas import extract_uuid_from_relation

    assert extract_uuid_from_relation(rel) is None
    assert extract_uuid_from_relation(None) is None


def test_task_create_schema_invalid_due_date():
    data: dict[str, Any] = {
        "title": "Buy groceries",
        "description": "Milk, Eggs, Bread",
        "is_completed": False,
        "due_date": "not-a-date",
    }
    with pytest.raises(ValidationError):
        TaskCreate(**data)


def test_task_update_schema_invalid_due_date():
    data: dict[str, Any] = {
        "due_date": "invalid-date",
    }
    with pytest.raises(ValidationError):
        TaskUpdate(**data)


def test_task_update_schema_empty():
    data: dict[str, Any] = {}
    task = TaskUpdate(**data)
    assert task.title is None
    assert task.description is None


def test_note_create_schema_missing_title():
    data: dict[str, Any] = {
        "content": "Discussed new project",
    }
    with pytest.raises(ValidationError):
        NoteCreate(**data)


def test_note_create_schema_invalid_agent_id():
    data: dict[str, Any] = {
        "title": "Meeting notes",
        "content": "Discussed new project",
        "agent_id": "not-a-uuid",
    }
    with pytest.raises(ValidationError):
        NoteCreate(**data)


def test_calendar_event_update_invalid_time():
    data: dict[str, Any] = {
        "start_time": "invalid-time",
    }
    with pytest.raises(ValidationError):
        CalendarEventUpdate(**data)


def test_calendar_event_create_invalid_time_range_same_time():
    now = datetime.datetime.now(datetime.UTC)
    data: dict[str, Any] = {
        "title": "Dentist Appointment",
        "start_time": now,
        "end_time": now,
        "is_all_day": False,
    }
    with pytest.raises(ValueError, match="end_time must be greater than start_time"):
        CalendarEventCreate(**data)
