"""Tests for memory deduplication logic."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.domain.memory.service import MemoryService


def _make_memory_with_content(content: str) -> MagicMock:
    m = MagicMock()
    m.id = uuid4()
    m.content = content
    return m


@pytest.mark.asyncio
async def test_store_memory_deduplicates_similar_content() -> None:
    """Second store with near-identical content must return None (deduplicated)."""
    user_id = uuid4()

    # Match_memories returns an existing memory (above threshold)
    existing = _make_memory_with_content("User loves Python programming")
    repo = MagicMock()
    repo.match_memories = AsyncMock(return_value=[existing])
    repo.insert_memory = AsyncMock()

    svc = MemoryService(repo)

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.domain.memory.service.embed", AsyncMock(return_value=[0.1] * 1536))
        result = await svc.store_memory("User loves Python programming", user_id=user_id)

    assert result is None
    repo.insert_memory.assert_not_called()


@pytest.mark.asyncio
async def test_store_memory_stores_unique_content() -> None:
    """Unique content must be inserted and return a UUID."""
    user_id = uuid4()
    inserted = _make_memory_with_content("User loves Go programming")

    repo = MagicMock()
    repo.match_memories = AsyncMock(return_value=[])  # No duplicates
    repo.insert_memory = AsyncMock(return_value=inserted)
    repo.create_relationship = AsyncMock()

    svc = MemoryService(repo)

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.domain.memory.service.embed", AsyncMock(return_value=[0.2] * 1536))
        result = await svc.store_memory("User loves Go programming", user_id=user_id)

    assert result == inserted.id
    repo.insert_memory.assert_called_once()


@pytest.mark.asyncio
async def test_store_memory_ignores_empty_content() -> None:
    """Empty or whitespace-only content must return None without hitting the DB."""
    repo = MagicMock()
    repo.match_memories = AsyncMock()
    svc = MemoryService(repo)

    result = await svc.store_memory("   ", user_id=uuid4())
    assert result is None
    repo.match_memories.assert_not_called()


@pytest.mark.asyncio
async def test_retrieve_memories_returns_list() -> None:
    """retrieve_memories must return a list of memories."""
    user_id = uuid4()
    mem = _make_memory_with_content("Test memory")
    repo = MagicMock()
    repo.match_memories = AsyncMock(return_value=[mem])
    svc = MemoryService(repo)

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.domain.memory.service.embed", AsyncMock(return_value=[0.0] * 1536))
        results = await svc.retrieve_memories("test", user_id=user_id)

    assert len(results) == 1
    assert results[0].content == "Test memory"
