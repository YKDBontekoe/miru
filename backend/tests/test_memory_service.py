from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# Deterministic UUIDs
TEST_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
TEST_AGENT_ID = UUID("22222222-2222-2222-2222-222222222222")
TEST_ROOM_ID = UUID("33333333-3333-3333-3333-333333333333")
TEST_MEM_ID_1 = UUID("44444444-4444-4444-4444-444444444441")
TEST_MEM_ID_2 = UUID("44444444-4444-4444-4444-444444444442")
TEST_MEM_ID_3 = UUID("44444444-4444-4444-4444-444444444443")
TEST_REL_ID_1 = UUID("55555555-5555-5555-5555-555555555555")


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
@patch("app.domain.memory.document_service.DocumentService.chunk_text")
async def test_store_document_memory(
    mock_chunk_text: MagicMock, mock_extract_text: MagicMock
) -> None:
    """Validates that storing a document successfully extracts text, chunks it, and calls store_memory."""
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_extract_text.return_value = "Fake document text"
    mock_chunk_text.return_value = ["chunk 1", "chunk 2"]

    with patch.object(service, "store_memory", new_callable=AsyncMock) as mock_store_memory:
        mock_store_memory.side_effect = [TEST_MEM_ID_1, TEST_MEM_ID_2, TEST_MEM_ID_3]

        file_obj = io.BytesIO(b"fake data")
        memory_ids = await service.store_document_memory(file_obj, "test.pdf", "application/pdf")

        assert len(memory_ids) == 2
        assert mock_store_memory.call_count == 3


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
async def test_store_document_memory_empty(mock_extract_text: MagicMock) -> None:
    """Validates that storing an empty document returns no memory IDs."""
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_extract_text.return_value = ""

    file_obj = io.BytesIO(b"fake data")
    memory_ids = await service.store_document_memory(file_obj, "empty.pdf", "application/pdf")

    assert len(memory_ids) == 0


@pytest.mark.asyncio
async def test_delete_memory_ownership() -> None:
    """Validates that memory deletion respects user ownership checks in the repository."""
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.delete_memory.return_value = True
    result = await service.delete_memory(TEST_MEM_ID_1, TEST_USER_ID)
    assert result is True
    mock_repo.delete_memory.assert_awaited_once_with(TEST_MEM_ID_1, user_id=TEST_USER_ID)

    mock_repo.delete_memory.reset_mock()
    mock_repo.delete_memory.return_value = False
    result_fail = await service.delete_memory(TEST_MEM_ID_1, TEST_USER_ID)
    assert result_fail is False
    mock_repo.delete_memory.assert_awaited_once_with(TEST_MEM_ID_1, user_id=TEST_USER_ID)


# --- New Tests for store_memory ---


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    """Validates that passing empty or whitespace-only content to store_memory returns None."""
    repo = MemoryRepository()
    service = MemoryService(repo)
    memory_id = await service.store_memory("   ")
    assert memory_id is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
@patch("asyncio.create_task")
async def test_store_memory_success(
    mock_create_task: MagicMock, mock_match: AsyncMock, mock_embed: AsyncMock
) -> None:
    """Validates that store_memory correctly embeds content, checks deduplication, inserts the memory, and triggers graph extraction."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = []

    memory_id = await service.store_memory(
        content="This is a test memory.",
        user_id=TEST_USER_ID,
    )

    assert memory_id is not None
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None
    assert db_mem.content == "This is a test memory."
    assert db_mem.user_id == TEST_USER_ID

    mock_create_task.assert_called_once()
    mock_match.assert_awaited_once()
    mock_embed.assert_awaited_once_with("This is a test memory.")

    coro = mock_create_task.call_args[0][0]
    coro.close()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
@patch("asyncio.create_task")
async def test_store_memory_deduplication(
    mock_create_task: MagicMock, mock_match: AsyncMock, mock_embed: AsyncMock
) -> None:
    """Validates that store_memory returns None early if the content is highly semantically similar to an existing memory."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    existing_mem = Memory(id=TEST_MEM_ID_1, content="Existing", embedding=[0.1] * 1536)
    mock_match.return_value = [existing_mem]

    memory_id = await service.store_memory(
        content="This is a test memory.",
        user_id=TEST_USER_ID,
    )

    assert memory_id is None
    mock_create_task.assert_not_called()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
@patch.object(MemoryRepository, "create_relationship", new_callable=AsyncMock)
@patch("asyncio.create_task")
async def test_store_memory_relationship_error(
    mock_create_task: MagicMock,
    mock_create_rel: AsyncMock,
    mock_match: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    """Validates that a failure in relationship creation does not block the overall memory creation."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = []
    mock_create_rel.side_effect = Exception("DB Error")

    memory_id = await service.store_memory(
        content="This is a test memory with relation.",
        user_id=TEST_USER_ID,
        related_to=[TEST_REL_ID_1],
    )

    assert memory_id is not None
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None
    mock_create_rel.assert_awaited_once()

    coro = mock_create_task.call_args[0][0]
    coro.close()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
@patch("asyncio.create_task")
async def test_store_memory_no_user(
    mock_create_task: MagicMock, mock_match: AsyncMock, mock_embed: AsyncMock
) -> None:
    """Validates that graph extraction is not triggered when storing a memory without a user_id."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = []

    memory_id = await service.store_memory(
        content="This is a test memory.",
        user_id=None,
        agent_id=TEST_AGENT_ID,
        room_id=TEST_ROOM_ID,
    )

    assert memory_id is not None
    mock_create_task.assert_not_called()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
@patch("asyncio.create_task")
async def test_store_memory_background_task_error(
    mock_create_task: MagicMock, mock_match: AsyncMock, mock_embed: AsyncMock
) -> None:
    """Validates that a failure to trigger the background graph extraction task does not block memory creation."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536
    mock_match.return_value = []
    mock_create_task.side_effect = Exception("Task Error")

    memory_id = await service.store_memory(
        content="This is a test memory.",
        user_id=TEST_USER_ID,
    )

    assert memory_id is not None
    db_mem = await Memory.get_or_none(id=memory_id)
    assert db_mem is not None

    coro = mock_create_task.call_args[0][0]
    coro.close()


# --- New Tests for get_memory_graph ---


@pytest.mark.asyncio
async def test_get_memory_graph_success() -> None:
    """Validates that fetching the memory graph returns correctly formatted nodes and edges for the user."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mem1 = await Memory.create(
        id=TEST_MEM_ID_1, content="Node 1", embedding=[0.1] * 1536, user_id=TEST_USER_ID
    )
    mem2 = await Memory.create(
        id=TEST_MEM_ID_2, content="Node 2", embedding=[0.2] * 1536, user_id=TEST_USER_ID
    )

    rel = await MemoryRelationship.create(
        id=TEST_REL_ID_1, source=mem1, target=mem2, relationship_type="RELATED_TO"
    )

    graph = await service.get_memory_graph(TEST_USER_ID)

    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    assert graph["edges"][0].id == rel.id


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    """Validates that fetching an empty memory graph returns empty lists for nodes and edges."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    graph = await service.get_memory_graph(TEST_USER_ID)

    assert graph["nodes"] == []
    assert graph["edges"] == []


# --- New Tests for retrieve_memories ---


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
async def test_retrieve_memories_with_query(mock_match: AsyncMock, mock_embed: AsyncMock) -> None:
    """Validates that retrieving memories with a query embeds the query and matches against the repository."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.5] * 1536
    mock_mem = Memory(id=TEST_MEM_ID_1, content="Retrieved", embedding=[0.5] * 1536)
    mock_match.return_value = [mock_mem]

    results = await service.retrieve_memories("Find this", user_id=TEST_USER_ID)

    assert len(results) == 1
    assert results[0].content == "Retrieved"
    mock_embed.assert_awaited_once_with("Find this")
    mock_match.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch.object(MemoryRepository, "match_memories", new_callable=AsyncMock)
async def test_retrieve_memories_empty_query(mock_match: AsyncMock, mock_embed: AsyncMock) -> None:
    """Validates that retrieving memories with an empty query uses a default zero vector and skips embedding."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_mem = Memory(id=TEST_MEM_ID_1, content="Retrieved", embedding=[0.0] * 1536)
    mock_match.return_value = [mock_mem]

    results = await service.retrieve_memories(
        "", user_id=TEST_USER_ID, agent_id=TEST_AGENT_ID, room_id=TEST_ROOM_ID
    )

    assert len(results) == 1
    mock_embed.assert_not_called()
    assert mock_match.call_args[0][0] == [0.0] * 1536
