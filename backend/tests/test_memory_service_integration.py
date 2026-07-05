"""Integration tests for the memory service."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from tortoise.exceptions import IntegrityError

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# Note: The test environment fails to start docker testcontainers due to DinD overlayfs errors
# `failed to mount /tmp/containerd-mountXXXXX ... fstype: overlay`
# As a result we fallback to sqlite and mock the pgvector specific match_memories function

@pytest.fixture
def test_user_id() -> str:
    return "11111111-1111-1111-1111-111111111111"

@pytest_asyncio.fixture(autouse=True)
async def db_cleanup():
    yield
    await MemoryRelationship.all().delete()
    await Memory.all().delete()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_empty(mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mem_id = await service.store_memory("   ", user_id=test_user_id)
    assert mem_id is None

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
async def test_store_memory_relationship_exception(mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    # We patch relationship create to simulate a DB constraint failure when saving a relationship
    with patch("app.infrastructure.repositories.memory_repo.MemoryRelationship.create", side_effect=IntegrityError("DB constraint failed")):
        res = await service.store_memory(
            content="This is a test fact.",
            user_id=test_user_id,
            related_to=[uuid4()]
        )

    assert res is not None
    # Verify memory was still stored despite relationship failure
    db_mem = await Memory.get(id=res)
    assert db_mem.content == "This is a test fact."

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph", side_effect=Exception("Failed graph extraction"))
async def test_store_memory_graph_exception(mock_graph, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    res = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id
    )

    assert res is not None
    db_mem = await Memory.get(id=res)
    assert db_mem.content == "This is a test fact."

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
async def test_store_memory_deduplication(mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    res = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id,
        related_to=[uuid4()]
    )

    assert res is not None
    db_mem = await Memory.get(id=res)

    # Second time, mock match_memories to return a duplicate (since we mock pgvector function)
    mock_match.return_value = [db_mem]

    dup_mem_id = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id,
    )

    assert dup_mem_id is None

@pytest.mark.asyncio
async def test_get_memory_graph(test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_uuid = UUID(test_user_id)

    memory_1 = await repo.insert_memory(Memory(content="A", embedding=[0.0]*1536, user_id=user_uuid))
    memory_2 = await repo.insert_memory(Memory(content="B", embedding=[0.0]*1536, user_id=user_uuid))

    await repo.create_relationship(memory_1.id, memory_2.id)

    graph = await service.get_memory_graph(user_uuid)

    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1

@pytest.mark.asyncio
async def test_get_memory_graph_empty(test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_uuid = UUID(test_user_id)

    graph = await service.get_memory_graph(user_uuid)

    assert len(graph["nodes"]) == 0
    assert len(graph["edges"]) == 0

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
async def test_retrieve_memories(mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_uuid = UUID(test_user_id)

    mock_embed.return_value = [0.1]*1536
    db_mem = await repo.insert_memory(Memory(content="Apples are red.", embedding=[0.1]*1536, user_id=user_uuid))
    mock_match.return_value = [db_mem]

    results = await service.retrieve_memories("red fruit", user_id=test_user_id)
    assert len(results) == 1
    assert results[0].content == "Apples are red."


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.domain.memory.service.logger")
async def test_store_memory_graph_unhandled_exception(mock_logger, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    # We can mock GraphExtractionService.process_and_store_graph.
    # To trigger the except Exception block on line 80, we need something inside the try block to throw.
    # Since it's an import asyncio and from ... import ... we can just use sys.modules or monkeypatch
    with patch.dict('sys.modules', {'app.domain.memory.graph_service': None}):
        res = await service.store_memory(
            content="This is a test fact.",
            user_id=test_user_id
        )
        assert res is not None
        mock_logger.warning.assert_called_with("Failed to trigger background graph extraction", exc_info=True)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
async def test_chaos_match_memories_error(mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.side_effect = Exception("Database is down")

    with pytest.raises(Exception, match="Database is down"):
        await service.retrieve_memories("test", user_id=test_user_id)

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
async def test_chaos_db_conflict(mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = []

    with patch("app.infrastructure.repositories.memory_repo.Memory.save", side_effect=IntegrityError("Conflict!")):
        with pytest.raises(IntegrityError):
            await service.store_memory("will fail", user_id=test_user_id)
