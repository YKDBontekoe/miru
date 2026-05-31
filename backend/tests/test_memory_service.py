from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# ---------------------------------------------------------------------------
# Document Service Tests (Existing)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
@patch("app.domain.memory.document_service.DocumentService.chunk_text")
async def test_store_document_memory(
    mock_chunk_text: MagicMock, mock_extract_text: MagicMock
) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_extract_text.return_value = "Fake document text"
    mock_chunk_text.return_value = ["chunk 1", "chunk 2"]

    # We need to mock store_memory inside the service
    with patch.object(service, "store_memory", new_callable=AsyncMock) as mock_store_memory:
        mock_store_memory.side_effect = [
            UUID("33333333-3333-3333-3333-333333333333"),
            UUID("44444444-4444-4444-4444-444444444444"),
            UUID("55555555-5555-5555-5555-555555555555"),
        ]

        file_obj = io.BytesIO(b"fake data")
        memory_ids = await service.store_document_memory(file_obj, "test.pdf", "application/pdf")

        assert len(memory_ids) == 2
        assert mock_store_memory.call_count == 3  # 1 for intro, 2 for chunks


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
async def test_store_document_memory_empty(mock_extract_text: MagicMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_extract_text.return_value = ""

    file_obj = io.BytesIO(b"fake data")
    memory_ids = await service.store_document_memory(file_obj, "empty.pdf", "application/pdf")

    assert len(memory_ids) == 0


@pytest.mark.asyncio
async def test_delete_memory_ownership() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    memory_id = UUID("33333333-3333-3333-3333-333333333333")
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    mock_repo.delete_memory.return_value = True
    result = await service.delete_memory(memory_id, user_id)
    assert result is True
    mock_repo.delete_memory.assert_awaited_once_with(memory_id, user_id=user_id)

    mock_repo.delete_memory.reset_mock()
    mock_repo.delete_memory.return_value = False
    result_fail = await service.delete_memory(memory_id, user_id)
    assert result_fail is False
    mock_repo.delete_memory.assert_awaited_once_with(memory_id, user_id=user_id)


# ---------------------------------------------------------------------------
# Integration Tests for MemoryService
# ---------------------------------------------------------------------------
# Following Test Engineer constraints:
# - SQLite in-memory real DB via fixture in conftest.
# - Mock only physical boundary: `embed` (LLM API) and `match_memories` (requires pgvector raw SQL)
# - No generic repo mocking for basic operations (insert, delete, retrieve).
# - Strict deterministic UUIDs.
# - No god-class mock-hell (>3).


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories")
@patch(
    "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
    new_callable=AsyncMock,
)
async def test_store_memory_success(
    mock_process_graph: AsyncMock,
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1, 0.2, 0.3]
    mock_match.return_value = []  # No existing memory deduplication match

    user_id = UUID("11111111-1111-1111-1111-111111111111")

    # Real DB dependency for relationships
    rel_memory = await Memory.create(content="related", embedding=[0.1], user_id=user_id)
    related_to = [rel_memory.id]

    # Act
    memory_id = await service.store_memory(
        content="New specific fact",
        user_id=user_id,
        related_to=related_to,
    )

    # Assert
    assert memory_id is not None

    # Assert real DB side-effect directly
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None
    assert db_mem.content == "New specific fact"
    assert db_mem.user_id == user_id

    # Assert real relationship creation
    rels = await MemoryRelationship.filter(source_id=memory_id).all()
    assert len(rels) == 1
    assert rels[0].target_id == related_to[0]

    # Assert domain side-effect triggered (background task)
    mock_process_graph.assert_awaited_once_with("New specific fact", user_id)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories")
async def test_store_memory_deduplication(
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    mock_embed.return_value = [0.1, 0.2, 0.3]

    # Mock finding an existing memory to trigger deduplication
    existing_mem = Memory(
        id=UUID("33333333-3333-3333-3333-333333333333"),
        content="New specific fact",
        embedding=[0.1],
    )
    mock_match.return_value = [existing_mem]

    # Act
    memory_id = await service.store_memory(
        content="New specific fact",
        user_id=user_id,
    )

    # Assert
    assert memory_id is None


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)

    # Act
    memory_id = await service.store_memory(content="   ")

    # Assert
    assert memory_id is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories")
@patch.object(MemoryRepository, "create_relationship", new_callable=AsyncMock)
@patch(
    "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
    new_callable=AsyncMock,
)
# TEST(miru-agent): refactor-required - Using 4 mocks due to external dependency mocking, consider abstracting boundary.
async def test_store_memory_relationship_failure_chaos(
    mock_process_graph: AsyncMock,
    mock_create_rel: AsyncMock,
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1, 0.2, 0.3]
    mock_match.return_value = []

    # Chaos Case: Simulate DB connection drop / constraint error during relationship creation
    mock_create_rel.side_effect = Exception("DB error")

    user_id = UUID("11111111-1111-1111-1111-111111111111")
    related_to = [UUID("22222222-2222-2222-2222-222222222222")]

    # Act
    memory_id = await service.store_memory(
        content="New specific fact",
        user_id=user_id,
        related_to=related_to,
    )

    # Assert: Should survive the relationship failure, create memory, and trigger background task
    assert memory_id is not None
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None
    mock_process_graph.assert_awaited_once_with("New specific fact", user_id)


@pytest.mark.asyncio
async def test_get_memory_graph_success() -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    mem1 = await Memory.create(content="Node 1", embedding=[0.1], user_id=user_id)
    mem2 = await Memory.create(content="Node 2", embedding=[0.2], user_id=user_id)
    rel = await MemoryRelationship.create(
        source_id=mem1.id, target_id=mem2.id, relationship_type="RELATED_TO"
    )

    # Act
    result = await service.get_memory_graph(user_id)

    # Assert
    assert len(result["nodes"]) == 2
    assert len(result["edges"]) == 1

    node_ids = {n.id for n in result["nodes"]}
    assert mem1.id in node_ids
    assert mem2.id in node_ids

    assert result["edges"][0].id == rel.id


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    # Act
    result = await service.get_memory_graph(user_id)

    # Assert
    assert result["nodes"] == []
    assert result["edges"] == []


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories")
async def test_retrieve_memories(
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    mock_embed.return_value = [0.5, 0.5]
    mock_mem = Memory(
        id=UUID("33333333-3333-3333-3333-333333333333"),
        content="Retrieved memory",
        embedding=[0.5, 0.5],
    )
    mock_match.return_value = [mock_mem]

    # Act - With query
    result = await service.retrieve_memories(query="test query", user_id=user_id)

    # Assert
    assert len(result) == 1
    assert result[0].content == "Retrieved memory"
    mock_embed.assert_awaited_once_with("test query")
    mock_match.assert_awaited_once_with([0.5, 0.5], 0.0, 5, user_id, None, None)

    mock_embed.reset_mock()
    mock_match.reset_mock()

    # Act - Without query
    result_empty = await service.retrieve_memories(query="", user_id=user_id)

    # Assert
    assert len(result_empty) == 1
    mock_embed.assert_not_called()
    mock_match.assert_awaited_once_with([0.0] * 1536, 0.0, 5, user_id, None, None)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories")
@patch(
    "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
    new_callable=AsyncMock,
)
async def test_store_memory_graph_task_failure_chaos(
    mock_process_graph: AsyncMock,
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    mock_embed.return_value = [0.1, 0.2, 0.3]
    mock_match.return_value = []

    # Chaos Case: Background Task throws exception (Timeout/Network)
    mock_process_graph.side_effect = Exception("Background Task Error")

    # Act
    memory_id = await service.store_memory(
        content="New specific fact",
        user_id=user_id,
    )

    # Assert: Should survive the background task failure and persist memory
    assert memory_id is not None
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None
    mock_process_graph.assert_called_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories")
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph", new_callable=AsyncMock)
@patch("asyncio.create_task")
# TEST(miru-agent): refactor-required - Heavy mocked test due to `asyncio` dependency mocking
async def test_store_memory_graph_task_create_failure_chaos(
    mock_create_task: MagicMock,
    mock_process_graph: AsyncMock,
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    # Arrange
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    mock_embed.return_value = [0.1, 0.2, 0.3]
    mock_match.return_value = []

    # Chaos Case: Task queue is full / fails to create task
    mock_create_task.side_effect = Exception("Create Task Error")

    # Act
    memory_id = await service.store_memory(
        content="New specific fact",
        user_id=user_id,
    )

    # Assert: Should survive the event loop failure
    assert memory_id is not None
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None
    mock_create_task.assert_called_once()
