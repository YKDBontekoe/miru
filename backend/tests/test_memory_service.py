from __future__ import annotations

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
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_retrieve_memories(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    # test with query
    mock_embed.return_value = [0.1] * 1536
    mock_repo.match_memories.return_value = []

    result = await service.retrieve_memories(
        "test query", user_id="00000000-0000-0000-0000-000000000001"
    )
    assert result == []
    mock_repo.match_memories.assert_awaited()
    assert mock_embed.call_count == 1

    # test without query
    mock_repo.match_memories.reset_mock()
    mock_embed.reset_mock()
    result = await service.retrieve_memories("", user_id="00000000-0000-0000-0000-000000000001")
    assert result == []
    mock_repo.match_memories.assert_awaited()
    assert mock_embed.call_count == 0


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    # Empty content
    assert await service.store_memory("") is None

    # deduplication
    mock_embed.return_value = [0.1] * 1536
    mock_repo.match_memories.return_value = [MagicMock()]
    assert await service.store_memory("test") is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_success(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.1] * 1536
    mock_repo.match_memories.return_value = []

    memory_mock = MagicMock()
    memory_mock.id = uuid4()
    mock_repo.insert_memory.return_value = memory_mock

    result = await service.store_memory("test new memory")
    assert result == memory_mock.id
    mock_repo.insert_memory.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_memory_graph() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()

    # Empty
    mock_repo.list_all_memories.return_value = []
    res = await service.get_memory_graph(user_id)
    assert res == {"nodes": [], "edges": []}

    # With data
    memory_mock = MagicMock()
    memory_mock.id = uuid4()
    mock_repo.list_all_memories.return_value = [memory_mock]
    mock_repo.get_relationships_subgraph.return_value = [
        {"source": memory_mock.id, "target": uuid4()}
    ]

    res = await service.get_memory_graph(user_id)
    assert len(res["nodes"]) == 1
    assert len(res["edges"]) == 1


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch(
    "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
    new_callable=AsyncMock,
)
@patch("asyncio.create_task")
async def test_store_memory_with_graph_extraction(
    mock_create_task: MagicMock, mock_process_graph: AsyncMock, mock_embed: AsyncMock
) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.1] * 1536
    mock_repo.match_memories.return_value = []

    memory_mock = MagicMock()
    memory_mock.id = uuid4()
    mock_repo.insert_memory.return_value = memory_mock

    user_id = uuid4()

    result = await service.store_memory(
        "test new memory related", user_id=user_id, related_to=[uuid4(), uuid4()]
    )

    assert result == memory_mock.id
    mock_repo.insert_memory.assert_awaited_once()
    assert mock_repo.create_relationship.call_count == 2
    mock_create_task.assert_called_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_create_relationship_error(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.1] * 1536
    mock_repo.match_memories.return_value = []

    memory_mock = MagicMock()
    memory_mock.id = uuid4()
    mock_repo.insert_memory.return_value = memory_mock
    mock_repo.create_relationship.side_effect = Exception("DB error")

    result = await service.store_memory("test new memory related", related_to=[uuid4()])

    assert result == memory_mock.id
    mock_repo.insert_memory.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch(
    "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
    new_callable=AsyncMock,
)
@patch("asyncio.create_task")
async def test_store_memory_graph_extraction_error(
    mock_create_task: MagicMock, mock_process_graph: AsyncMock, mock_embed: AsyncMock
) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.1] * 1536
    mock_repo.match_memories.return_value = []

    memory_mock = MagicMock()
    memory_mock.id = uuid4()
    mock_repo.insert_memory.return_value = memory_mock

    mock_create_task.side_effect = Exception("Failed to start task")
    user_id = uuid4()

    result = await service.store_memory("test new memory graph extract error", user_id=user_id)

    assert result == memory_mock.id
    mock_repo.insert_memory.assert_awaited_once()
