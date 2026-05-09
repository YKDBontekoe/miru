from __future__ import annotations

import io
from collections.abc import Awaitable, Callable
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository


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
def mock_embed(monkeypatch: pytest.MonkeyPatch) -> Callable[[str], Awaitable[list[float]]]:
    async def _mock_embed(text: str) -> list[float]:
        return [0.1] * 1536

    monkeypatch.setattr("app.domain.memory.service.embed", _mock_embed)
    return _mock_embed


@pytest.mark.asyncio
async def test_store_memory_with_related_to_exceptions(
    mock_embed: Callable[..., Awaitable[list[float]]],
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    m1 = Memory(content="existing", embedding=[0.1] * 1536)
    await m1.save()

    async def mock_match(*args, **kwargs):
        return []
    repo.match_memories = mock_match

    # Test ValueError
    async def mock_bulk_error(*args, **kwargs):
        raise ValueError("Invalid target")
    repo.bulk_create_relationships = mock_bulk_error
    memory_id = await service.store_memory("new memory", related_to=[m1.id])
    assert memory_id is not None

    # Test unexpected Exception
    async def mock_bulk_exception(*args, **kwargs):
        raise Exception("Database down")
    repo.bulk_create_relationships = mock_bulk_exception
    memory_id2 = await service.store_memory("new memory 2", related_to=[m1.id])
    assert memory_id2 is not None


@pytest.mark.asyncio
@patch("asyncio.create_task")
async def test_store_memory_background_task(
    mock_create_task: MagicMock,
    mock_embed: Callable[..., Awaitable[list[float]]],
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = uuid4()

    async def mock_match(*args, **kwargs):
        return []
    repo.match_memories = mock_match

    memory_id = await service.store_memory("new memory", user_id=user_id)
    assert memory_id is not None
    mock_create_task.assert_called_once()

    # prevent unawaited coroutine warning
    args, _ = mock_create_task.call_args
    coro = args[0]
    coro.close()

@pytest.mark.asyncio
@patch("asyncio.create_task")
async def test_store_memory_background_task_exception(
    mock_create_task: MagicMock,
    mock_embed: Callable[..., Awaitable[list[float]]],
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = uuid4()

    async def mock_match(*args, **kwargs):
        return []
    repo.match_memories = mock_match

    mock_create_task.side_effect = Exception("Background task failed")
    memory_id = await service.store_memory("new memory", user_id=user_id)
    assert memory_id is not None

    try:
        args, _ = mock_create_task.call_args
        coro = args[0]
        coro.close()
    except Exception:
        pass



@pytest.mark.asyncio
async def test_get_memory_graph():
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = uuid4()

    async def mock_list(u_id):
        return []
    repo.list_all_memories = mock_list

    graph = await service.get_memory_graph(user_id)
    assert graph["nodes"] == []

    async def mock_list2(u_id):
        m1 = Memory(id=uuid4(), content="m1", user_id=u_id, embedding=[0.1]*1536)
        return [m1]
    repo.list_all_memories = mock_list2

    async def mock_edges(m_ids):
        return []
    repo.get_relationships_subgraph = mock_edges

    graph2 = await service.get_memory_graph(user_id)
    assert len(graph2["nodes"]) == 1

@pytest.mark.asyncio
async def test_retrieve_memories(mock_embed):
    repo = MemoryRepository()
    service = MemoryService(repo)

    async def mock_match(*args, **kwargs):
        return [Memory(content="match", embedding=[0.1]*1536)]
    repo.match_memories = mock_match

    mems = await service.retrieve_memories("query")
    assert len(mems) == 1

    mems_empty = await service.retrieve_memories("")
    assert len(mems_empty) == 1

    # cover early exits
    mem_none = await service.store_memory("   ")
    assert mem_none is None

    async def mock_match_existing(*args, **kwargs):
        return [Memory(id=uuid4())]
    repo.match_memories = mock_match_existing

    mem_exists = await service.store_memory("new memory")
    assert mem_exists is None


@pytest.mark.asyncio
async def test_store_memory_with_related_to(
    mock_embed: Callable[..., Awaitable[list[float]]],
) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    m1 = Memory(content="existing", embedding=[0.1] * 1536)
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
