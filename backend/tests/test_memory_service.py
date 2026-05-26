from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.service import MemoryService


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.domain.memory.document_service.DocumentService.extract_text")
@patch("app.domain.memory.document_service.DocumentService.chunk_text")
async def test_store_document_memory(
    mock_chunk_text: MagicMock, mock_extract_text: MagicMock, mock_embed: AsyncMock
) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_extract_text.return_value = "Fake document text"
    mock_chunk_text.return_value = ["chunk 1", "chunk 2"]

    # We mock the repository
    mock_embed.return_value = [[0.1], [0.2], [0.3]]
    mock_repo.match_memories.side_effect = [None, None, None]  # No existing memories

    mock_memory1, mock_memory2, mock_memory3 = MagicMock(), MagicMock(), MagicMock()
    mock_memory1.id = uuid4()
    mock_memory2.id = uuid4()
    mock_memory3.id = uuid4()
    mock_repo.bulk_insert_memories.return_value = [mock_memory1, mock_memory2, mock_memory3]

    file_obj = io.BytesIO(b"fake data")
    memory_ids = await service.store_document_memory(file_obj, "test.pdf", "application/pdf")

    assert len(memory_ids) == 2
    mock_repo.bulk_insert_memories.assert_awaited_once()


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
