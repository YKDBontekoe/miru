from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.models import (
    Memory,
    MemoryRelationship,
)
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# Since this repository tests the MemoryService heavily with MemoryRepository,
# and MemoryRepository uses raw pgvector SQL that breaks in SQLite (`match_memories`),
# and we are unable to spawn testcontainers on GitHub Actions in this specific environment,
# we will mock ONLY `repo.match_memories` while running everything else through
# the actual SQLite in-memory integration database configured in conftest.py.
# This gives us a 90% integration test setup following constraints as closely as possible.


@pytest.fixture
def repo() -> MemoryRepository:
    """Returns a fresh MemoryRepository instance for testing.

    Provides isolated in-memory database interaction per test.
    """
    return MemoryRepository()


@pytest.fixture
def service(repo: MemoryRepository) -> MemoryService:
    """Returns a MemoryService constructed with the testing repository.

    The service relies on the isolated repository lifecycle for its state.
    """
    return MemoryService(repo)


@pytest.mark.asyncio
async def test_store_memory_success(service: MemoryService) -> None:
    content = "Test memory"
    user_id = uuid4()
    related_id1 = uuid4()
    related_id2 = uuid4()

    # Pre-seed related memories into the DB (Integration Test of DB logic)
    m1 = Memory(id=related_id1, content="Related 1", user_id=user_id, embedding=[0.0])
    m2 = Memory(id=related_id2, content="Related 2", user_id=user_id, embedding=[0.0])
    await m1.save()
    await m2.save()

    # We mock openrouter's embed and the postgres-specific vector search
    with (
        patch("app.domain.memory.service.embed", return_value=[0.1] * 1536),
        patch.object(service.repo, "match_memories", new_callable=AsyncMock) as mock_match,
        patch("asyncio.create_task") as mock_create_task,
        patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph"),
    ):
        import asyncio

        future: asyncio.Future[None] = asyncio.Future()
        future.set_result(None)
        mock_create_task.return_value = future

        # Simulate no existing deduplications
        mock_match.return_value = []

        memory_id = await service.store_memory(
            content, user_id=user_id, related_to=[related_id1, related_id2]
        )

        assert memory_id is not None

        # Verify side effects directly from DB
        memories = await Memory.filter(user_id=user_id, content=content).all()
        assert len(memories) == 1

        # Verify relationships were created
        relationships = await MemoryRelationship.filter(source_id=memory_id).all()
        assert len(relationships) == 2
        target_ids = {getattr(r, "target_id") for r in relationships}  # noqa: B009
        assert target_ids == {related_id1, related_id2}

        mock_create_task.assert_called()


@pytest.mark.asyncio
async def test_store_memory_empty(service: MemoryService) -> None:
    # No DB mocking, tests fast exit logic
    res = await service.store_memory("   ")
    assert res is None


@pytest.mark.asyncio
async def test_store_memory_deduplicated(service: MemoryService) -> None:
    content = "Test memory deduplicated"
    user_id = uuid4()

    # Existing memory that we will mock as matching
    m = Memory(content=content, user_id=user_id, embedding=[0.1] * 1536)
    await m.save()

    with (
        patch("app.domain.memory.service.embed", return_value=[0.1] * 1536),
        patch.object(service.repo, "match_memories", new_callable=AsyncMock) as mock_match,
    ):
        mock_match.return_value = [m]

        # Should return None because it was deduplicated
        memory_id = await service.store_memory(content, user_id=user_id)
        assert memory_id is None

        # Ensure it wasn't inserted a second time
        count = await Memory.filter(content=content).count()
        assert count == 1


@pytest.mark.asyncio
async def test_store_memory_relationship_error(service: MemoryService) -> None:
    content = "Test memory relationship error"
    user_id = uuid4()

    with (
        patch("app.domain.memory.service.embed", return_value=[0.1] * 1536),
        patch.object(service.repo, "match_memories", new_callable=AsyncMock) as mock_match,
        patch.object(service.repo, "create_relationship", new_callable=AsyncMock) as mock_rel,
        patch("asyncio.create_task") as mock_create_task,
        patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph"),
    ):
        import asyncio

        future: asyncio.Future[None] = asyncio.Future()
        future.set_result(None)
        mock_create_task.return_value = future

        mock_match.return_value = []
        mock_rel.side_effect = Exception("DB constraint failed")

        # Provide a related ID, which will trigger the exception internally but should be caught
        memory_id = await service.store_memory(content, user_id=user_id, related_to=[uuid4()])

        assert memory_id is not None
        # It still inserted the memory
        assert await Memory.filter(id=memory_id).exists()


@pytest.mark.asyncio
async def test_store_memory_graph_task_error(service: MemoryService) -> None:
    content = "Test memory relationship error"
    user_id = uuid4()

    with (
        patch("app.domain.memory.service.embed", return_value=[0.1] * 1536),
        patch.object(service.repo, "match_memories", new_callable=AsyncMock) as mock_match,
        patch("asyncio.create_task", side_effect=Exception("Task error")),
        patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph"),
    ):
        mock_match.return_value = []

        memory_id = await service.store_memory(content, user_id=user_id)

        assert memory_id is not None
        assert await Memory.filter(id=memory_id).exists()


@pytest.mark.asyncio
async def test_get_memory_graph(service: MemoryService) -> None:
    user_id = uuid4()

    # Setup DB
    m1 = Memory(content="Node 1", user_id=user_id, embedding=[0.1])
    m2 = Memory(content="Node 2", user_id=user_id, embedding=[0.2])
    await m1.save()
    await m2.save()

    rel = MemoryRelationship(source=m1, target=m2, relationship_type="RELATED_TO")
    await rel.save()

    graph = await service.get_memory_graph(user_id)

    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    assert getattr(graph["edges"][0], "source_id") == m1.id  # noqa: B009
    assert getattr(graph["edges"][0], "target_id") == m2.id  # noqa: B009


@pytest.mark.asyncio
async def test_get_memory_graph_empty(service: MemoryService) -> None:
    graph = await service.get_memory_graph(uuid4())
    assert graph["nodes"] == []
    assert graph["edges"] == []


@pytest.mark.asyncio
async def test_retrieve_memories(service: MemoryService) -> None:
    user_id = uuid4()

    # We must mock match_memories because it relies on PostgreSQL pgvector SQL functions
    with (
        patch("app.domain.memory.service.embed", return_value=[0.5] * 1536),
        patch.object(service.repo, "match_memories", new_callable=AsyncMock) as mock_match,
    ):
        # Return a fake memory
        fake_mem = Memory(id=uuid4(), content="Result", embedding=[0.5])
        mock_match.return_value = [fake_mem]

        results = await service.retrieve_memories("search query", user_id=user_id)

        assert results == [fake_mem]
        mock_match.assert_called_once()


@pytest.mark.asyncio
async def test_retrieve_memories_empty_query(service: MemoryService) -> None:
    # Tests that when query is empty, we don't call embed, we use default zeros
    with (
        patch("app.domain.memory.service.embed") as mock_embed,
        patch.object(service.repo, "match_memories", new_callable=AsyncMock) as mock_match,
    ):
        mock_match.return_value = []
        results = await service.retrieve_memories("")

        assert results == []
        mock_embed.assert_not_called()
        # Default zeros vector is 1536 long
        call_args = mock_match.call_args[0]
        assert call_args[0] == [0.0] * 1536


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
@patch("app.domain.memory.document_service.DocumentService.chunk_text")
async def test_store_document_memory(
    mock_chunk_text: MagicMock, mock_extract_text: MagicMock, service: MemoryService
) -> None:
    mock_extract_text.return_value = "Fake document text"
    mock_chunk_text.return_value = ["chunk 1", "chunk 2"]

    # We mock the internal store_memory to avoid dealing with embeddings and graph extraction for documents
    with patch.object(service, "store_memory", new_callable=AsyncMock) as mock_store_memory:
        mock_store_memory.side_effect = [uuid4(), uuid4(), uuid4()]

        file_obj = io.BytesIO(b"fake data")
        memory_ids = await service.store_document_memory(file_obj, "test.pdf", "application/pdf")

        assert len(memory_ids) == 2
        assert mock_store_memory.call_count == 3  # 1 for intro, 2 for chunks


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
async def test_store_document_memory_empty(
    mock_extract_text: MagicMock, service: MemoryService
) -> None:
    mock_extract_text.return_value = ""

    file_obj = io.BytesIO(b"fake data")
    memory_ids = await service.store_document_memory(file_obj, "empty.pdf", "application/pdf")

    assert len(memory_ids) == 0


@pytest.mark.asyncio
async def test_delete_memory_ownership(service: MemoryService) -> None:
    user_id = uuid4()

    # Setup real DB
    m = Memory(content="To delete", user_id=user_id, embedding=[0.0])
    await m.save()

    # Try deleting with wrong user
    other_user = uuid4()
    result_fail = await service.delete_memory(m.id, user_id=other_user)
    assert result_fail is False
    assert await Memory.filter(id=m.id).exists()

    # Try deleting with correct user
    result = await service.delete_memory(m.id, user_id=user_id)
    assert result is True
    assert not await Memory.filter(id=m.id).exists()
