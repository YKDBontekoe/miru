from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from app.domain.memory.service import MemoryService
from app.domain.memory.models import Memory


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_bulk_relationships(mock_embed: AsyncMock) -> None:
    # Set up memory IDs
    memory_id = UUID("00000000-0000-0000-0000-000000000001")
    rel_id_1 = UUID("00000000-0000-0000-0000-000000000002")
    rel_id_2 = UUID("00000000-0000-0000-0000-000000000003")

    mock_repo = AsyncMock()
    mock_repo.match_memories.return_value = []

    stored_memory = MagicMock()
    stored_memory.id = memory_id
    mock_repo.insert_memory.return_value = stored_memory

    mock_embed.return_value = [0.1] * 1536

    service = MemoryService(mock_repo)

    result = await service.store_memory(
        content="Test content",
        related_to=[rel_id_1, rel_id_2]
    )

    assert result == memory_id
    mock_repo.create_relationships_bulk.assert_awaited_once_with([
        (memory_id, rel_id_1),
        (memory_id, rel_id_2)
    ])


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

    with patch.object(service, "store_memory", new_callable=AsyncMock) as mock_store_memory:
        mock_store_memory.side_effect = [
            UUID("00000000-0000-0000-0000-000000000001"),
            UUID("00000000-0000-0000-0000-000000000002"),
            UUID("00000000-0000-0000-0000-000000000003")
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
    memory_id = UUID("00000000-0000-0000-0000-000000000001")
    user_id = UUID("00000000-0000-0000-0000-000000000002")

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
async def test_retrieve_memories_default_vector(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.match_memories.return_value = []

    # Query is empty so default vector is used
    await service.retrieve_memories(query="")

    # Verify match_memories was called with the default vector [0.0]*1536
    call_args = mock_repo.match_memories.call_args
    assert call_args is not None
    called_vector = call_args[0][0]
    assert len(called_vector) == 1536
    assert all(v == 0.0 for v in called_vector)
