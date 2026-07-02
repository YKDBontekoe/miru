from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from tortoise.exceptions import IntegrityError

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

TEST_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
TEST_AGENT_ID = UUID("22222222-2222-2222-2222-222222222222")
TEST_ROOM_ID = UUID("33333333-3333-3333-3333-333333333333")
MEMORY_ID_1 = UUID("44444444-4444-4444-4444-444444444444")
MEMORY_ID_2 = UUID("55555555-5555-5555-5555-555555555555")

@pytest_asyncio.fixture(autouse=True)
async def cleanup_memories() -> None:
    await MemoryRelationship.filter(source_id__in=[MEMORY_ID_1, MEMORY_ID_2]).delete()
    await MemoryRelationship.filter(target_id__in=[MEMORY_ID_1, MEMORY_ID_2]).delete()
    await Memory.filter(id__in=[MEMORY_ID_1, MEMORY_ID_2]).delete()
    yield
    await MemoryRelationship.filter(source_id__in=[MEMORY_ID_1, MEMORY_ID_2]).delete()
    await MemoryRelationship.filter(target_id__in=[MEMORY_ID_1, MEMORY_ID_2]).delete()
    await Memory.filter(id__in=[MEMORY_ID_1, MEMORY_ID_2]).delete()


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
async def test_store_memory_success(mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match, \
         patch("asyncio.create_task") as mock_create_task:
        mock_match.return_value = []

        memory_id = await service.store_memory(
            content="I love pizza",
            user_id=TEST_USER_ID,
            agent_id=TEST_AGENT_ID,
            room_id=TEST_ROOM_ID
        )

        assert memory_id is not None
        mem = await Memory.get_or_none(id=memory_id)
        assert mem is not None
        assert mem.content == "I love pizza"
        assert mem.user_id == TEST_USER_ID
        assert mem.agent_id == TEST_AGENT_ID
        assert mem.room_id == TEST_ROOM_ID

        mock_create_task.assert_called_once()

        await mem.delete()


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)
    memory_id = await service.store_memory(content="   ", user_id=TEST_USER_ID)
    assert memory_id is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_deduplication(mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match, \
         patch("asyncio.create_task") as mock_create_task:
        # Mock finding an existing memory
        mock_match.return_value = [Memory(id=uuid4(), content="I love pizza")]

        memory_id = await service.store_memory(
            content="I love pizza",
            user_id=TEST_USER_ID
        )
        assert memory_id is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_with_relationships(mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    await Memory.create(id=MEMORY_ID_1, content="I love Italian food", embedding=[0.2] * 1536)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match, \
         patch("asyncio.create_task"):
        mock_match.return_value = []

        memory_id = await service.store_memory(
            content="I love pizza",
            user_id=TEST_USER_ID,
            related_to=[MEMORY_ID_1]
        )

        assert memory_id is not None
        rels = await MemoryRelationship.filter(source_id=memory_id).all()
        assert len(rels) == 1
        assert rels[0].target_id == MEMORY_ID_1

        await Memory.filter(id=memory_id).delete()




@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph", new_callable=AsyncMock)
async def test_store_memory_with_relationships(mock_graph: AsyncMock, mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    await Memory.create(id=MEMORY_ID_1, content="I love Italian food", embedding=[0.2] * 1536)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match, \
         patch("asyncio.create_task"):
        mock_match.return_value = []

        memory_id = await service.store_memory(
            content="I love pizza",
            user_id=TEST_USER_ID,
            related_to=[MEMORY_ID_1]
        )

        assert memory_id is not None
        rels = await MemoryRelationship.filter(source_id=memory_id).all()
        assert len(rels) == 1
        assert rels[0].target_id == MEMORY_ID_1

        await Memory.filter(id=memory_id).delete()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph", new_callable=AsyncMock)
async def test_store_memory_background_extraction_failure(mock_graph: AsyncMock, mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match, \
         patch("asyncio.create_task") as mock_create_task:
        mock_match.return_value = []
        mock_create_task.side_effect = Exception("Background task failure")

        # Should not raise exception, but log it and still return memory_id
        memory_id = await service.store_memory(
            content="I love pizza",
            user_id=TEST_USER_ID
        )

        assert memory_id is not None
        await Memory.filter(id=memory_id).delete()

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_relationship_creation_failure(mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match, \
         patch("asyncio.create_task"), \
         patch.object(repo, "create_relationship", new_callable=AsyncMock) as mock_create_rel:
        mock_match.return_value = []
        mock_create_rel.side_effect = Exception("DB error")

        # Should not raise exception, but log it and still return memory_id
        memory_id = await service.store_memory(
            content="I love pizza",
            user_id=TEST_USER_ID,
            related_to=[MEMORY_ID_1]
        )

        assert memory_id is not None
        await Memory.filter(id=memory_id).delete()


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    graph = await service.get_memory_graph(user_id=TEST_USER_ID)
    assert graph == {"nodes": [], "edges": []}


@pytest.mark.asyncio
async def test_get_memory_graph_with_data() -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    await Memory.create(id=MEMORY_ID_1, user_id=TEST_USER_ID, content="Memory 1", embedding=[0.1] * 1536)
    await Memory.create(id=MEMORY_ID_2, user_id=TEST_USER_ID, content="Memory 2", embedding=[0.2] * 1536)
    rel = await MemoryRelationship.create(source_id=MEMORY_ID_1, target_id=MEMORY_ID_2)

    graph = await service.get_memory_graph(user_id=TEST_USER_ID)

    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    assert graph["edges"][0].id == rel.id


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_retrieve_memories(mock_embed: AsyncMock) -> None:
    mock_embed.return_value = [0.1] * 1536
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_memory = Memory(id=MEMORY_ID_1, content="Result")

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = [mock_memory]

        results = await service.retrieve_memories(
            query="test query",
            user_id=TEST_USER_ID,
            agent_id=TEST_AGENT_ID,
            room_id=TEST_ROOM_ID
        )

        assert len(results) == 1
        assert results[0].id == MEMORY_ID_1
        mock_embed.assert_called_once_with("test query")
        mock_match.assert_called_once_with([0.1] * 1536, 0.0, 5, TEST_USER_ID, TEST_AGENT_ID, TEST_ROOM_ID)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_retrieve_memories_empty_query(mock_embed: AsyncMock) -> None:
    repo = MemoryRepository()
    service = MemoryService(repo)

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []

        results = await service.retrieve_memories(query="")

        assert len(results) == 0
        mock_embed.assert_not_called()
        mock_match.assert_called_once_with([0.0] * 1536, 0.0, 5, None, None, None)
