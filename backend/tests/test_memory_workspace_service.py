from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest

from app.domain.memory.models import Memory
from app.domain.memory.service import MemoryService


def _memory(*, content: str, created_at: datetime, user_id: UUID | None = None) -> Memory:
    return Memory(
        id=uuid4(),
        user_id=uuid4() if user_id is None else user_id,
        content=content,
        embedding=[0.1, 0.2],
        created_at=created_at,
        updated_at=created_at,
    )


@pytest.mark.asyncio
async def test_search_memories_empty_query_uses_repo_window() -> None:
    mock_repo = AsyncMock()
    today = datetime.now(UTC)
    mock_repo.list_memories_between.return_value = [_memory(content="A", created_at=today)]
    service = MemoryService(mock_repo)

    result = await service.search_memories(
        user_id=uuid4(),
        query=" ",
        start_date=date.today() - timedelta(days=1),
        end_date=date.today(),
        limit=10,
    )

    assert len(result) == 1
    mock_repo.list_memories_between.assert_awaited_once()


@pytest.mark.asyncio
async def test_merge_memories_merges_and_deletes_duplicates() -> None:
    mock_repo = AsyncMock()
    user_id = uuid4()
    now = datetime.now(UTC)
    first = _memory(content="Alpha", created_at=now - timedelta(days=2), user_id=user_id)
    second = _memory(content="Beta", created_at=now - timedelta(days=1), user_id=user_id)
    mock_repo.get_memories_by_ids.return_value = [first, second]

    service = MemoryService(mock_repo)
    with pytest.MonkeyPatch.context() as patch_context:
        patch_context.setattr(
            "app.domain.memory.service.embed",
            AsyncMock(return_value=[0.2, 0.3]),
        )
        merged = await service.merge_memories(user_id=user_id, memory_ids=[first.id, second.id])

    assert merged is not None
    assert merged.content == "Alpha\n\nBeta"
    assert merged.meta["merged_from"] == [str(second.id)]
    mock_repo.update_memory.assert_awaited_once()
    mock_repo.delete_memory.assert_awaited_once_with(second.id)


@pytest.mark.asyncio
async def test_get_on_this_day_filters_by_month_day_and_year() -> None:
    mock_repo = AsyncMock()
    user_id = uuid4()
    now = datetime.now(UTC)
    should_include = _memory(
        content="Old",
        created_at=now.replace(year=now.year - 1),
        user_id=user_id,
    )
    should_exclude_current_year = _memory(content="Current", created_at=now, user_id=user_id)
    should_exclude_other_day = _memory(
        content="Other",
        created_at=now - timedelta(days=1),
        user_id=user_id,
    )
    mock_repo.list_all_memories.return_value = [
        should_include,
        should_exclude_current_year,
        should_exclude_other_day,
    ]

    service = MemoryService(mock_repo)
    result = await service.get_on_this_day(user_id)

    assert result == [should_include]
