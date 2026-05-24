from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

TEST_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
TEST_AGENT_ID = UUID("22222222-2222-2222-2222-222222222222")
TEST_MEM1_ID = UUID("33333333-3333-3333-3333-333333333333")
TEST_MEM2_ID = UUID("44444444-4444-4444-4444-444444444444")
TEST_MEM3_ID = UUID("55555555-5555-5555-5555-555555555555")


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
        mock_store_memory.side_effect = [TEST_MEM1_ID, TEST_MEM2_ID, TEST_MEM3_ID]

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
    memory_id = TEST_MEM1_ID
    user_id = TEST_USER_ID

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
async def test_store_memory_success(mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    user_id = TEST_USER_ID
    related_id = TEST_MEM1_ID

    # Pre-insert related memory manually
    await Memory.create(id=related_id, content="related", embedding=[0.1] * 1536, user_id=user_id)

    async def fake_match_memories(*args, **kwargs):
        return []

    # Patch SQLite-unsupported match_memories method (because of pgvector)
    monkeypatch.setattr(repo, "match_memories", fake_match_memories)

    # Patch create_task to prevent background coroutine unawaited warnings
    def side_effect_create_task(coro):
        coro.close()
        return MagicMock()

    monkeypatch.setattr("asyncio.create_task", side_effect_create_task)

    memory_id = await service.store_memory(
        content="A new fact", user_id=user_id, related_to=[related_id]
    )

    assert memory_id is not None

    # Verify db creation
    mem = await Memory.get_or_none(id=memory_id)
    assert mem is not None
    assert mem.content == "A new fact"
    assert mem.user_id == user_id

    rel = await MemoryRelationship.filter(source_id=memory_id, target_id=related_id).first()
    assert rel is not None


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    memory_id = await service.store_memory(content="   ")
    assert memory_id is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_already_exists_deduplication(
    mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536

    existing_mem = Memory(id=TEST_MEM2_ID, content="Exists", embedding=[0.1] * 1536)

    async def fake_match_memories(*args, **kwargs):
        return [existing_mem]

    monkeypatch.setattr(repo, "match_memories", fake_match_memories)

    memory_id = await service.store_memory(content="Exists")
    assert memory_id is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_relationship_creation_fails(
    mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    user_id = TEST_USER_ID
    related_id = TEST_MEM3_ID

    async def fake_match_memories(*args, **kwargs):
        return []

    monkeypatch.setattr(repo, "match_memories", fake_match_memories)

    def side_effect_create_task(coro):
        coro.close()
        return MagicMock()

    monkeypatch.setattr("asyncio.create_task", side_effect_create_task)

    async def fake_create_relationship(*args, **kwargs):
        raise Exception("DB Error")

    monkeypatch.setattr(repo, "create_relationship", fake_create_relationship)

    memory_id = await service.store_memory(
        content="Fact with failed rel", user_id=user_id, related_to=[related_id]
    )

    assert memory_id is not None

    # Memory still created
    mem = await Memory.get_or_none(id=memory_id)
    assert mem is not None
    assert mem.content == "Fact with failed rel"


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_background_task_fails(
    mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    user_id = TEST_USER_ID

    async def fake_match_memories(*args, **kwargs):
        return []

    monkeypatch.setattr(repo, "match_memories", fake_match_memories)

    def side_effect_create_task(coro):
        coro.close()
        raise Exception("Task Error")

    monkeypatch.setattr("asyncio.create_task", side_effect_create_task)

    memory_id = await service.store_memory(content="Fact with failed task", user_id=user_id)

    assert memory_id is not None

    mem = await Memory.get_or_none(id=memory_id)
    assert mem is not None
    assert mem.content == "Fact with failed task"


@pytest.mark.asyncio
async def test_get_memory_graph_success() -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = TEST_USER_ID
    mem1_id = TEST_MEM1_ID
    mem2_id = TEST_MEM2_ID

    await Memory.create(id=mem1_id, content="First", embedding=[0.1] * 1536, user_id=user_id)
    await Memory.create(id=mem2_id, content="Second", embedding=[0.2] * 1536, user_id=user_id)
    await MemoryRelationship.create(
        source_id=mem1_id, target_id=mem2_id, relationship_type="RELATED_TO"
    )

    graph = await service.get_memory_graph(user_id)

    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = TEST_USER_ID

    graph = await service.get_memory_graph(user_id)

    assert len(graph["nodes"]) == 0
    assert len(graph["edges"]) == 0


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_with_query(
    mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    user_id = TEST_USER_ID
    mem = Memory(id=TEST_MEM1_ID, content="A retrieved memory", embedding=[0.1] * 1536)

    async def fake_match_memories(*args, **kwargs):
        return [mem]

    monkeypatch.setattr(repo, "match_memories", fake_match_memories)

    memories = await service.retrieve_memories(query="test query", user_id=user_id)

    assert len(memories) == 1
    assert memories[0].content == "A retrieved memory"
    mock_embed.assert_awaited_once_with("test query")


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_empty_query(
    mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    user_id = TEST_USER_ID

    async def fake_match_memories(*args, **kwargs):
        return []

    monkeypatch.setattr(repo, "match_memories", fake_match_memories)

    memories = await service.retrieve_memories(query="", user_id=user_id)

    assert len(memories) == 0
    mock_embed.assert_not_called()
