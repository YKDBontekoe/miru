from __future__ import annotations

from unittest.mock import AsyncMock, patch
from uuid import UUID

import pytest

from app.domain.memory.models import Memory
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# Deterministic UUIDs
TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")
TEST_RELATED_ID = UUID("00000000-0000-0000-0000-000000000002")


@pytest.mark.asyncio
async def test_store_memory_success() -> None:
    """Verifies that storing a new memory successfully saves to DB, creates relationships, and extracts graphs."""
    # TEST(miru-agent): refactor-required
    repo = MemoryRepository()
    service = MemoryService(repo)

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
        patch("asyncio.create_task"),
        patch(
            "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
            new_callable=AsyncMock,
        ),
    ):
        mock_match.return_value = []
        mock_embed.return_value = [0.1] * 1536

        mem = Memory(
            id=TEST_RELATED_ID,
            content="test relation",
            embedding=[0.2] * 1536,
            user_id=TEST_USER_ID,
        )
        await mem.save()

        result = await service.store_memory(
            "Alice is my sister", user_id=TEST_USER_ID, related_to=[mem.id]
        )

        # Verify side effects
        assert result is not None
        memories = await repo.list_all_memories(TEST_USER_ID)
        assert len(memories) == 2

        relationships = await repo.get_relationships_subgraph([mem.id, result])
        assert len(relationships) == 1


@pytest.mark.asyncio
async def test_store_memory_empty() -> None:
    """Verifies that attempting to store an empty string returns None without DB side effects."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    result = await service.store_memory("   ")
    assert result is None


@pytest.mark.asyncio
async def test_store_memory_deduplication() -> None:
    """Verifies that an identical existing memory is detected and bypasses the DB insert."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
    ):
        mock_embed.return_value = [0.1] * 1536
        mock_match.return_value = [Memory(content="Alice is my sister", embedding=[0.1] * 1536)]

        result = await service.store_memory("Alice is my sister", user_id=TEST_USER_ID)

        assert result is None
        memories = await repo.list_all_memories(TEST_USER_ID)
        assert len(memories) == 0


@pytest.mark.asyncio
async def test_store_memory_relationship_exception() -> None:
    """Verifies that a failure during relationship creation logs a warning but still stores the memory."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.create_relationship",
            new_callable=AsyncMock,
        ) as mock_create_rel,
    ):
        mock_match.return_value = []
        mock_embed.return_value = [0.1] * 1536
        mock_create_rel.side_effect = Exception("db error")

        with patch("app.domain.memory.service.logger.warning") as mock_logger:
            result = await service.store_memory(
                "Alice is my sister", user_id=TEST_USER_ID, related_to=[TEST_RELATED_ID]
            )

            assert result is not None
            mock_logger.assert_called_with("Relationship creation failed: db error")
            memories = await repo.list_all_memories(TEST_USER_ID)
            assert len(memories) == 1


@pytest.mark.asyncio
async def test_store_memory_graph_trigger_exception() -> None:
    """Verifies that a failure to trigger background graph extraction logs a warning but still stores the memory."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
        patch("asyncio.create_task") as mock_create_task,
    ):
        mock_match.return_value = []
        mock_embed.return_value = [0.1] * 1536
        mock_create_task.side_effect = Exception("task error")

        with patch("app.domain.memory.service.logger.warning") as mock_logger:
            result = await service.store_memory("Alice is my sister", user_id=TEST_USER_ID)

            assert result is not None
            mock_logger.assert_called_with(
                "Failed to trigger background graph extraction", exc_info=True
            )
            memories = await repo.list_all_memories(TEST_USER_ID)
            assert len(memories) == 1


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    """Verifies that retrieving a memory graph for a user with no memories returns an empty structure."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    result = await service.get_memory_graph(TEST_USER_ID)
    assert result == {"nodes": [], "edges": []}


@pytest.mark.asyncio
async def test_get_memory_graph_populated() -> None:
    """Verifies that the retrieved memory graph correctly maps stored nodes and relationships."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mem1 = Memory(content="Alice", embedding=[0.1] * 1536, user_id=TEST_USER_ID)
    await mem1.save()
    mem2 = Memory(content="Bob", embedding=[0.2] * 1536, user_id=TEST_USER_ID)
    await mem2.save()

    await repo.create_relationship(mem1.id, mem2.id)

    result = await service.get_memory_graph(TEST_USER_ID)
    assert len(result["nodes"]) == 2
    assert len(result["edges"]) == 1


@pytest.mark.asyncio
async def test_retrieve_memories() -> None:
    """Verifies that memory retrieval functions correctly with both populated and empty string queries."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
    ):
        mock_match.return_value = [Memory(content="Alice", embedding=[0.1] * 1536)]
        mock_embed.return_value = [0.1] * 1536

        res1 = await service.retrieve_memories("query", user_id=TEST_USER_ID)
        assert len(res1) == 1

        res2 = await service.retrieve_memories("", user_id=TEST_USER_ID)
        assert len(res2) == 1
        mock_embed.assert_called_once()  # should not be called the second time
