from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.service import MemoryService


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("app.domain.memory.document_service.DocumentService.extract_text")
@patch("app.domain.memory.document_service.DocumentService.chunk_text")
async def test_store_document_memory(
    mock_chunk_text: MagicMock, mock_extract_text: MagicMock, mock_embed: AsyncMock
) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_extract_text.return_value = "Fake document text"
    mock_chunk_text.return_value = ["chunk 1", "chunk 2"]

    # Mock embeddings response, length should match unique chunks (3 here)
    mock_embed.return_value = [[0.1] * 1536, [0.2] * 1536, [0.3] * 1536]

    # No existing exact matches
    mock_repo.match_memories.return_value = []

    # Mock returning inserted objects
    class MockInserted:
        def __init__(self) -> None:
            self.id = uuid4()
            self.content = "fake content"

    mock_repo.bulk_insert_memories.return_value = [MockInserted(), MockInserted(), MockInserted()]

    file_obj = io.BytesIO(b"fake data")

    with (
        patch(
            "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
            new_callable=AsyncMock,
        ),
        patch("asyncio.create_task") as mock_create_task,
    ):
        # Helper to execute the coroutine that `create_task` was called with
        def mock_create_task_side_effect(coro):
            import asyncio

            return (
                asyncio.get_event_loop().run_until_complete(coro)
                if not asyncio.get_event_loop().is_running()
                else coro.send(None)
            )

        # Actually we just want to suppress the warning, let's just make it do nothing and close the coro
        def safe_create_task(coro):
            coro.close()
            return MagicMock()

        mock_create_task.side_effect = safe_create_task

        memory_ids = await service.store_document_memory(
            file_obj, "test.pdf", "application/pdf", user_id=uuid4()
        )

        assert len(memory_ids) == 3
        assert mock_embed.call_count == 1
        mock_repo.bulk_insert_memories.assert_called_once()
        assert mock_create_task.call_count == 3


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
