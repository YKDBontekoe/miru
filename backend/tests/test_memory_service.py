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


@pytest.fixture
def mock_embed(monkeypatch):
    async def _mock_embed(text):
        return [0.1] * 1536
    monkeypatch.setattr("app.domain.memory.service.embed", _mock_embed)
    return _mock_embed

from app.infrastructure.repositories.memory_repo import MemoryRepository
from app.domain.memory.models import MemoryRelationship, Memory

@pytest.mark.asyncio
async def test_store_memory_with_related_to(mock_embed):
    repo = MemoryRepository()
    service = MemoryService(repo)
    m1 = Memory(content="existing", embedding=[0.1]*1536)
    await m1.save()

    # Mock the match_memories to bypass vector match sqlite errors
    async def mock_match(*args, **kwargs):
        return []
    repo.match_memories = mock_match

    memory_id = await service.store_memory("new memory", related_to=[m1.id])

    # Assert bulk_create_relationships logic coverage
    assert memory_id is not None
    rels = await MemoryRelationship.all()
    assert len(rels) == 1
    assert rels[0].source_id == memory_id
    assert rels[0].target_id == m1.id

    assert memory_id is not None

    rels = await MemoryRelationship.all()
    assert len(rels) == 1
    assert rels[0].source_id == memory_id
    assert rels[0].target_id == m1.id
