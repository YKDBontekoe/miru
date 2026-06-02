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
async def test_store_memory_basic() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_memory = MagicMock()
    mock_memory.id = uuid4()
    mock_repo.insert_memory.return_value = mock_memory
    mock_repo.match_memories.return_value = []  # no existing memories

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        result = await service.store_memory(content="test memory")

        assert result == mock_memory.id
        mock_repo.insert_memory.assert_awaited_once()


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    result = await service.store_memory(content="   ")
    assert result is None


@pytest.mark.asyncio
async def test_store_memory_duplicate() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.match_memories.return_value = [MagicMock()]  # returns existing memory

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        result = await service.store_memory(content="test memory")

        assert result is None
        mock_repo.insert_memory.assert_not_called()


@pytest.mark.asyncio
async def test_store_memory_with_relationships() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_memory = MagicMock()
    mock_memory.id = uuid4()
    mock_repo.insert_memory.return_value = mock_memory
    mock_repo.match_memories.return_value = []  # no existing memories

    related_id_1 = uuid4()
    related_id_2 = uuid4()

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        result = await service.store_memory(
            content="test memory", related_to=[related_id_1, related_id_2]
        )

        assert result == mock_memory.id
        assert mock_repo.create_relationship.call_count == 2
        mock_repo.create_relationship.assert_any_call(mock_memory.id, related_id_1)
        mock_repo.create_relationship.assert_any_call(mock_memory.id, related_id_2)


@pytest.mark.asyncio
async def test_store_memory_graph_extraction_trigger() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_memory = MagicMock()
    mock_memory.id = uuid4()
    mock_repo.insert_memory.return_value = mock_memory
    mock_repo.match_memories.return_value = []

    user_id = uuid4()

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        with (
            patch("asyncio.create_task") as mock_create_task,
            patch(
                "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
                new_callable=MagicMock,
            ) as mock_process,
        ):
            mock_process.return_value = "coro"
            result = await service.store_memory(content="test memory", user_id=user_id)

            assert result == mock_memory.id
            mock_process.assert_called_once_with("test memory", user_id)
            mock_create_task.assert_called_once_with("coro")


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()

    mock_repo.list_all_memories.return_value = []

    result = await service.get_memory_graph(user_id)
    assert result == {"nodes": [], "edges": []}


@pytest.mark.asyncio
async def test_get_memory_graph() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)
    user_id = uuid4()

    m1 = MagicMock()
    m1.id = uuid4()
    m2 = MagicMock()
    m2.id = uuid4()

    mock_repo.list_all_memories.return_value = [m1, m2]
    mock_repo.get_relationships_subgraph.return_value = ["edge1"]

    result = await service.get_memory_graph(user_id)
    assert result == {"nodes": [m1, m2], "edges": ["edge1"]}
    mock_repo.get_relationships_subgraph.assert_awaited_once_with([m1.id, m2.id])


@pytest.mark.asyncio
async def test_retrieve_memories_no_query() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.match_memories.return_value = ["memory1"]

    result = await service.retrieve_memories(query="")
    assert result == ["memory1"]
    # assert embed was not called and default vector was used
    # This is slightly hard to assert exactly without mocking embed, but we can verify match_memories was called correctly
    mock_repo.match_memories.assert_awaited_once()


@pytest.mark.asyncio
async def test_retrieve_memories_with_query() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.match_memories.return_value = ["memory1"]

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.5] * 1536
        result = await service.retrieve_memories(query="search")
        assert result == ["memory1"]
        mock_embed.assert_awaited_once_with("search")


@pytest.mark.asyncio
async def test_store_memory_relationship_exception() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_memory = MagicMock()
    mock_memory.id = uuid4()
    mock_repo.insert_memory.return_value = mock_memory
    mock_repo.match_memories.return_value = []

    mock_repo.create_relationship.side_effect = Exception("DB Error")

    related_id = uuid4()

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        with patch("app.domain.memory.service.logger") as mock_logger:
            result = await service.store_memory(content="test memory", related_to=[related_id])

            assert result == mock_memory.id
            mock_logger.warning.assert_called_once()


@pytest.mark.asyncio
async def test_store_memory_graph_extraction_exception() -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_memory = MagicMock()
    mock_memory.id = uuid4()
    mock_repo.insert_memory.return_value = mock_memory
    mock_repo.match_memories.return_value = []

    user_id = uuid4()

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        with (
            patch("asyncio.create_task", side_effect=Exception("Task error")),
            patch(
                "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
                new_callable=MagicMock,
            ),
            patch("app.domain.memory.service.logger") as mock_logger,
        ):
            result = await service.store_memory(content="test memory", user_id=user_id)

            assert result == mock_memory.id
            mock_logger.warning.assert_called_once_with(
                "Failed to trigger background graph extraction", exc_info=True
            )


@pytest.mark.asyncio
async def test_store_memory_relationship_exception_handling() -> None:
    # Coverage for the Exception block in store_memory relationships handling
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_memory = MagicMock()
    mock_memory.id = uuid4()
    mock_repo.insert_memory.return_value = mock_memory
    mock_repo.match_memories.return_value = []

    mock_repo.create_relationship.side_effect = Exception("Intentional DB Error")

    related_id = uuid4()

    with patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 1536

        with patch("app.domain.memory.service.logger.warning") as mock_logger_warning:
            result = await service.store_memory(content="test memory", related_to=[related_id])

            assert result == mock_memory.id
            mock_logger_warning.assert_called_once()
            assert "Relationship creation failed" in mock_logger_warning.call_args[0][0]
