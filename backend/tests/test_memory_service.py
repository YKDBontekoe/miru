from __future__ import annotations

import contextlib
import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.service import MemoryService


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
        mock_store_memory.side_effect = [uuid4(), uuid4(), uuid4()]

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
    memory_id = uuid4()
    user_id = uuid4()

    mock_repo.delete_memory.return_value = True
    result = await service.delete_memory(memory_id, user_id)
    assert result is True
    mock_repo.delete_memory.assert_awaited_once_with(memory_id, user_id=user_id)

    mock_repo.delete_memory.reset_mock()
    mock_repo.delete_memory.return_value = False
    result_fail = await service.delete_memory(memory_id, user_id)
    assert result_fail is False
    mock_repo.delete_memory.assert_awaited_once_with(memory_id, user_id=user_id)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph")
async def test_store_memory_success(mock_process_graph: MagicMock, mock_embed: MagicMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()
    related_to = [uuid4()]

    mock_embed.return_value = [0.1, 0.2]
    mock_repo.match_memories.return_value = []

    class FakeMemory:
        id = uuid4()

    mock_repo.insert_memory.return_value = FakeMemory()

    import asyncio

    task = await service.store_memory(
        content="Test content", user_id=user_id, related_to=related_to, _return_task=True
    )
    if task and isinstance(task, asyncio.Task):
        await asyncio.wait_for(task, timeout=5.0)

    mock_embed.assert_awaited_once_with("Test content")
    mock_repo.match_memories.assert_awaited_once()
    mock_repo.insert_memory.assert_awaited_once()
    mock_repo.create_relationship.assert_awaited_once_with(FakeMemory.id, related_to[0])
    mock_process_graph.assert_awaited_once_with("Test content", user_id)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph")
async def test_store_memory_exceptions(
    mock_process_graph: MagicMock, mock_embed: MagicMock
) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()
    related_to = [uuid4()]

    mock_embed.return_value = [0.1, 0.2]
    mock_repo.match_memories.return_value = []

    class FakeMemory:
        id = uuid4()

    mock_repo.insert_memory.return_value = FakeMemory()
    mock_repo.create_relationship.side_effect = Exception("relationship error")
    mock_process_graph.side_effect = Exception("process graph error")

    import asyncio

    task = await service.store_memory(
        content="Test content", user_id=user_id, related_to=related_to, _return_task=True
    )
    if task and isinstance(task, asyncio.Task):
        with contextlib.suppress(Exception):
            await asyncio.wait_for(task, timeout=5.0)

    mock_repo.create_relationship.assert_awaited_once_with(FakeMemory.id, related_to[0])
    mock_process_graph.assert_called_once_with("Test content", user_id)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_graph_import_error(mock_embed: MagicMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()

    mock_embed.return_value = [0.1, 0.2]
    mock_repo.match_memories.return_value = []

    class FakeMemory:
        id = uuid4()

    mock_repo.insert_memory.return_value = FakeMemory()

    with patch.dict("sys.modules", {"app.domain.memory.graph_service": None}):
        memory_id = await service.store_memory(content="Test content", user_id=user_id)

    assert memory_id == FakeMemory.id


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_deduplication(mock_embed: MagicMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.1, 0.2]
    # Simulate an existing match to trigger dedup
    mock_repo.match_memories.return_value = [{"id": uuid4()}]

    memory_id = await service.store_memory(content="Existing content")

    assert memory_id is None
    mock_repo.insert_memory.assert_not_called()


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    memory_id = await service.store_memory(content="   \n")

    assert memory_id is None
    mock_repo.match_memories.assert_not_called()


@pytest.mark.asyncio
async def test_get_memory_graph() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()

    class FakeMemory:
        id = uuid4()

    mock_repo.list_all_memories.return_value = [FakeMemory()]
    mock_repo.get_relationships_subgraph.return_value = ["edge_1"]

    result = await service.get_memory_graph(user_id)

    assert result["nodes"] == [mock_repo.list_all_memories.return_value[0]]
    assert result["edges"] == ["edge_1"]


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()

    mock_repo.list_all_memories.return_value = []

    result = await service.get_memory_graph(user_id)

    assert result["nodes"] == []
    assert result["edges"] == []
    mock_repo.get_relationships_subgraph.assert_not_called()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories(mock_embed: MagicMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.1, 0.2]
    mock_repo.match_memories.return_value = ["memory1", "memory2"]

    results = await service.retrieve_memories(query="test query")

    assert results == ["memory1", "memory2"]
    mock_embed.assert_awaited_once_with("test query")
    mock_repo.match_memories.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_empty_query(mock_embed: MagicMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.match_memories.return_value = []

    results = await service.retrieve_memories(query="")

    assert results == []
    # embed shouldn't be called if query is empty, default [0.0]*1536 is used
    mock_embed.assert_not_called()
    mock_repo.match_memories.assert_awaited_once()
