import uuid
from unittest.mock import MagicMock, patch

from app.infrastructure.repositories.productivity_repo import _map_event, _map_note


def test_map_note_agent_exception():
    note = MagicMock()
    note.id = uuid.uuid4()
    note.user_id = uuid.uuid4()
    note.title = "title"
    note.content = "content"
    note.is_pinned = False
    note.created_at = None
    note.updated_at = None
    note.deleted_at = None
    note.origin_context = None

    # Force _extract_uuid to raise Exception for agent_id
    with patch("app.infrastructure.repositories.productivity_repo._extract_uuid") as mock_extract:
        mock_extract.side_effect = Exception("DB Error")

        # Test fallback to getattr(note.agent, "id")
        agent_mock = MagicMock()
        agent_mock.id = uuid.uuid4()
        note.agent = agent_mock
        note.origin_message = None

        res = _map_note(note)
        assert res.agent_id == agent_mock.id


def test_map_note_origin_message_exception():
    note = MagicMock()
    note.id = uuid.uuid4()
    note.user_id = uuid.uuid4()
    note.title = "title"
    note.content = "content"
    note.is_pinned = False
    note.created_at = None
    note.updated_at = None
    note.deleted_at = None
    note.origin_context = None
    note.agent = None

    # Force _extract_uuid to raise Exception
    with patch("app.infrastructure.repositories.productivity_repo._extract_uuid") as mock_extract:
        mock_extract.side_effect = Exception("DB Error")

        # Test fallback to getattr(note.origin_message, "id")
        msg_mock = MagicMock()
        msg_mock.id = uuid.uuid4()
        note.origin_message = msg_mock

        res = _map_note(note)
        assert res.origin_message_id == msg_mock.id


def test_map_event_agent_exception():
    event = MagicMock()
    event.id = uuid.uuid4()
    event.user_id = uuid.uuid4()
    event.title = "title"
    event.description = None
    event.start_time = None
    event.end_time = None
    event.is_all_day = False
    event.location = None
    event.origin_context = None
    event.created_at = None
    event.updated_at = None
    event.deleted_at = None
    event.origin_message = None

    with patch("app.infrastructure.repositories.productivity_repo._extract_uuid") as mock_extract:
        mock_extract.side_effect = Exception("DB Error")

        agent_mock = MagicMock()
        agent_mock.id = uuid.uuid4()
        event.agent = agent_mock

        res = _map_event(event)
        assert res.agent_id == agent_mock.id


def test_map_event_origin_message_exception():
    event = MagicMock()
    event.id = uuid.uuid4()
    event.user_id = uuid.uuid4()
    event.title = "title"
    event.description = None
    event.start_time = None
    event.end_time = None
    event.is_all_day = False
    event.location = None
    event.origin_context = None
    event.created_at = None
    event.updated_at = None
    event.deleted_at = None
    event.agent = None

    with patch("app.infrastructure.repositories.productivity_repo._extract_uuid") as mock_extract:
        mock_extract.side_effect = Exception("DB Error")

        msg_mock = MagicMock()
        msg_mock.id = uuid.uuid4()
        event.origin_message = msg_mock

        res = _map_event(event)
        assert res.origin_message_id == msg_mock.id


def test_map_note_both_exceptions():
    note = MagicMock()
    note.id = uuid.uuid4()
    note.user_id = uuid.uuid4()
    note.title = "title"
    note.content = "content"
    note.is_pinned = False
    note.created_at = None
    note.updated_at = None
    note.deleted_at = None
    note.origin_context = None

    # Make getattr(note, "agent") raise Exception
    type(note).agent = property(lambda self: (_ for _ in ()).throw(Exception("No!")))
    type(note).origin_message = property(lambda self: (_ for _ in ()).throw(Exception("No!")))

    with patch("app.infrastructure.repositories.productivity_repo._extract_uuid") as mock_extract:
        mock_extract.side_effect = Exception("DB Error")

        res = _map_note(note)
        assert res.agent_id is None
        assert res.origin_message_id is None


def test_map_event_both_exceptions():
    event = MagicMock()
    event.id = uuid.uuid4()
    event.user_id = uuid.uuid4()
    event.title = "title"
    event.description = None
    event.start_time = None
    event.end_time = None
    event.is_all_day = False
    event.location = None
    event.origin_context = None
    event.created_at = None
    event.updated_at = None
    event.deleted_at = None

    type(event).agent = property(lambda self: (_ for _ in ()).throw(Exception("No!")))
    type(event).origin_message = property(lambda self: (_ for _ in ()).throw(Exception("No!")))

    with patch("app.infrastructure.repositories.productivity_repo._extract_uuid") as mock_extract:
        mock_extract.side_effect = Exception("DB Error")

        res = _map_event(event)
        assert res.agent_id is None
        assert res.origin_message_id is None
