from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.agent_tools.productivity.notes_tools import (
    CreateNoteTool,
    ListNotesTool,
)
from app.domain.productivity.entities import NoteEntity


@pytest.fixture
def mock_service() -> Iterator[MagicMock]:
    with patch("app.domain.agent_tools.productivity.notes_tools.get_productivity_use_case") as mock:
        yield mock


@pytest.mark.asyncio
async def test_list_notes_tool_empty(mock_service: MagicMock) -> None:
    mock_service.return_value.list_notes = AsyncMock(return_value=[])
    tool = ListNotesTool(user_id=uuid4())
    result = await tool._run()
    assert result == "No notes found."


@pytest.mark.asyncio
async def test_list_notes_tool_with_notes(mock_service: MagicMock) -> None:
    note1 = NoteEntity(
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        id=uuid4(),
        title="Note 1",
        content="Short content",
        is_pinned=False,
        user_id=uuid4(),
    )
    note2 = NoteEntity(
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        id=uuid4(),
        title="Note 2",
        content="Content",
        is_pinned=True,
        user_id=uuid4(),
    )
    mock_service.return_value.list_notes = AsyncMock(return_value=[note1, note2])

    tool = ListNotesTool(user_id=uuid4())
    result = await tool._run()

    assert "Notes:" in result
    assert "Note 1" in result
    assert "Short content" in result
    assert "Note 2" in result
    assert "(Pinned)" in result


@pytest.mark.asyncio
async def test_list_notes_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.list_notes = AsyncMock(side_effect=Exception("DB Error"))
    tool = ListNotesTool(user_id=uuid4())
    result = await tool._run()
    assert "Error fetching notes." in result


@pytest.mark.asyncio
async def test_create_note_tool_success(mock_service: MagicMock) -> None:
    note_id = uuid4()
    mock_note = NoteEntity(
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        id=note_id,
        title="New Note",
        content="Content",
        is_pinned=False,
        user_id=uuid4(),
    )
    mock_service.return_value.create_note = AsyncMock(return_value=mock_note)

    tool = CreateNoteTool(user_id=uuid4())
    result = await tool._run(title="New Note", content="Content", origin_context="Origin")

    assert f"Successfully created note 'New Note' with ID {note_id}." in result


@pytest.mark.asyncio
async def test_create_note_tool_error(mock_service: MagicMock) -> None:
    mock_service.return_value.create_note = AsyncMock(side_effect=Exception("DB Error"))
    tool = CreateNoteTool(user_id=uuid4())
    result = await tool._run(title="New Note", content="Content")
    assert "Error creating note." in result
