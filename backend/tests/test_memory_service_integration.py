"""Integration tests for the memory service."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

import pytest
import pytest_asyncio

from app.domain.memory.models import Memory
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
    await Memory.all().delete()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.insert_memory")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.create_relationship")
async def test_store_memory_empty(mock_create_rel, mock_insert, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mem_id = await service.store_memory("   ", user_id=test_user_id)
    assert mem_id is None

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.insert_memory")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.create_relationship")
async def test_store_memory_relationship_exception(mock_create_rel, mock_insert, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    mem_id = uuid4()
    mock_insert.return_value = Memory(id=mem_id, content="fact", embedding=[0.1]*1536)

    mock_create_rel.side_effect = Exception("DB constraint failed")

    res = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id,
        related_to=[uuid4()]
    )

    assert res == mem_id

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.insert_memory")
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph", side_effect=Exception("Failed graph extraction"))
async def test_store_memory_graph_exception(mock_graph, mock_insert, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    mem_id = uuid4()
    mock_insert.return_value = Memory(id=mem_id, content="fact", embedding=[0.1]*1536)

    res = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id
    )

    assert res == mem_id

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.insert_memory")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.create_relationship")
async def test_store_memory_deduplication(mock_create_rel, mock_insert, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    mem_id = uuid4()
    mock_insert.return_value = Memory(id=mem_id, content="fact", embedding=[0.1]*1536)

    res = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id,
        related_to=[uuid4()]
    )

    assert res is not None

    # Second time, mock match_memories to return a duplicate
    mock_match.return_value = [
        Memory(
            id=res,
            content="This is a test fact.",
            embedding=[0.1]*1536,
            user_id=test_user_id
        )
    ]

    dup_mem_id = await service.store_memory(
        content="This is a test fact.",
        user_id=test_user_id,
    )

    assert dup_mem_id is None

@pytest.mark.asyncio
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.list_all_memories")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.get_relationships_subgraph")
async def test_get_memory_graph(mock_get_rel, mock_list_memories, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_uuid = UUID(test_user_id)

    mem_id_1 = uuid4()
    mem_id_2 = uuid4()

    mock_list_memories.return_value = [
        Memory(id=mem_id_1, content="A", embedding=[0.0]*1536, user_id=user_uuid),
        Memory(id=mem_id_2, content="B", embedding=[0.0]*1536, user_id=user_uuid)
    ]
    mock_get_rel.return_value = [
        # Normally returns MemoryRelationship
        AsyncMock(source_id=mem_id_1, target_id=mem_id_2)
    ]

    graph = await service.get_memory_graph(user_uuid)

    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1

@pytest.mark.asyncio
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.list_all_memories")
async def test_get_memory_graph_empty(mock_list_memories, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_uuid = UUID(test_user_id)

    mock_list_memories.return_value = []

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
    mock_match.return_value = [
        Memory(content="Apples are red.", embedding=[0.1]*1536, user_id=user_uuid)
    ]

    results = await service.retrieve_memories("red fruit", user_id=test_user_id)
    assert len(results) == 1
    assert results[0].content == "Apples are red."


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories")
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.insert_memory")
@patch("app.domain.memory.service.logger")
async def test_store_memory_graph_unhandled_exception(mock_logger, mock_insert, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = [] # No duplicate

    mem_id = uuid4()
    mock_insert.return_value = Memory(id=mem_id, content="fact", embedding=[0.1]*1536)

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
@patch("app.domain.memory.service.logger")
async def test_chaos_match_memories_error(mock_logger, mock_match, mock_embed, test_user_id: str) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.side_effect = Exception("Database is down")

    with pytest.raises(Exception, match="Database is down"):
        await service.retrieve_memories("test", user_id=test_user_id)
