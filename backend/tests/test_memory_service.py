from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository


@pytest.fixture
def memory_service() -> MemoryService:
    repo = MemoryRepository()
    return MemoryService(repo)


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
@patch("app.domain.memory.document_service.DocumentService.chunk_text")
async def test_store_document_memory(
    mock_chunk_text: MagicMock, mock_extract_text: MagicMock, memory_service: MemoryService
) -> None:
    # Use real DB, mock only OpenRouter embed boundary inside store_memory

    mock_extract_text.return_value = "Fake document text"
    mock_chunk_text.return_value = ["chunk 1", "chunk 2"]

    with patch.object(memory_service, "store_memory", new_callable=AsyncMock) as mock_store_memory:
        mock_store_memory.side_effect = [uuid4(), uuid4(), uuid4()]

        file_obj = io.BytesIO(b"fake data")
        memory_ids = await memory_service.store_document_memory(
            file_obj, "test.pdf", "application/pdf"
        )

        assert len(memory_ids) == 2
        assert mock_store_memory.call_count == 3  # 1 for intro, 2 for chunks


@pytest.mark.asyncio
@patch("app.domain.memory.document_service.DocumentService.extract_text")
async def test_store_document_memory_empty(
    mock_extract_text: MagicMock, memory_service: MemoryService
) -> None:

    mock_extract_text.return_value = ""

    file_obj = io.BytesIO(b"fake data")
    memory_ids = await memory_service.store_document_memory(
        file_obj, "empty.pdf", "application/pdf"
    )

    assert len(memory_ids) == 0


@pytest.mark.asyncio
async def test_delete_memory_ownership(memory_service: MemoryService):
    """Test delete_memory_ownership.


    Args: None

    Returns: None

    """
    user_id = uuid4()

    # Arrange: Insert memory into DB
    memory = Memory(content="Test DB memory", user_id=user_id, embedding=[0.0])
    await memory_service.repo.insert_memory(memory)

    # Act: Attempt to delete with correct user
    result = await memory_service.delete_memory(memory.id, user_id)

    # Assert: Verify side effect (memory is gone)
    assert result is True
    check_memory = await Memory.get_or_none(id=memory.id)
    assert check_memory is None

    # Chaos case: Attempt to delete non-existent memory
    result_fail = await memory_service.delete_memory(uuid4(), user_id)
    assert result_fail is False


@pytest.mark.asyncio
async def test_store_memory_empty_content(memory_service: MemoryService):
    """Test store_memory_empty_content.


    Args: None

    Returns: None

    """
    res = await memory_service.store_memory("   ")
    assert res is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_dedup_hit(mock_embed: AsyncMock, memory_service: MemoryService) -> None:

    mock_embed.return_value = [0.1, 0.2]

    # Capture local baseline
    baseline_count = await Memory.all().count()

    # Mock match_memories since pgvector isn't supported in SQLite
    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = [Memory(content="existing fact", embedding=[0.1, 0.2])]

        res = await memory_service.store_memory("already exists", user_id=uuid4())

        assert res is None
        # Assert nothing was saved
        assert await Memory.all().count() == baseline_count


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("asyncio.create_task")
async def test_store_memory_success_with_relationships_and_bg(
    mock_create_task: MagicMock, mock_embed: AsyncMock, memory_service: MemoryService
) -> None:

    mock_embed.return_value = [0.1, 0.2]

    # Mock match_memories to return empty
    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []

        u_id = uuid4()

        # Create a related memory first so FK constraint passes
        related_memory = Memory(content="related", embedding=[0.0])
        await related_memory.save()
        rel_id = related_memory.id

        # Act
        res = await memory_service.store_memory("new fact", user_id=u_id, related_to=[rel_id])

        # Assert
        assert res is not None
        saved_memory = await Memory.get_or_none(id=res)
        assert saved_memory is not None
        assert saved_memory.content == "new fact"

        # Verify relationship side effect
        rel = await MemoryRelationship.get_or_none(source_id=res, target_id=rel_id)
        assert rel is not None

        mock_create_task.assert_called_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_store_memory_chaos_relationship_failure(
    mock_embed: AsyncMock, memory_service: MemoryService
) -> None:

    mock_embed.return_value = [0.1, 0.2]

    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []

        # Chaos case: relationship creation raises exception. Mock the repo method directly to trigger it
        with patch.object(
            memory_service.repo, "create_relationship", new_callable=AsyncMock
        ) as mock_create_rel:
            mock_create_rel.side_effect = Exception("Chaos DB lock")

            with patch("asyncio.create_task"):
                u_id = uuid4()
                rel_id = uuid4()
                res = await memory_service.store_memory(
                    "chaos fact", user_id=u_id, related_to=[rel_id]
                )

                assert res is not None  # Should still return memory id despite relationship failure
                # Verify memory was actually saved
                saved_memory = await Memory.get_or_none(id=res)
                assert saved_memory is not None
                assert saved_memory.content == "chaos fact"


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
@patch("asyncio.create_task")
async def test_store_memory_chaos_bg_task_failure(
    mock_create_task: MagicMock, mock_embed: AsyncMock, memory_service: MemoryService
) -> None:

    mock_embed.return_value = [0.1, 0.2]

    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []

        mock_create_task.side_effect = Exception("Chaos task failure")

        u_id = uuid4()
        res = await memory_service.store_memory("task failure fact", user_id=u_id)

        assert res is not None  # Should still return memory id despite bg failure
        saved_memory = await Memory.get_or_none(id=res)
        assert saved_memory is not None


@pytest.mark.asyncio
async def test_get_memory_graph_empty(memory_service: MemoryService):
    """Test get_memory_graph_empty.



    Args: None


    Returns: None


    """
    u_id = uuid4()
    # Act with clean DB
    res = await memory_service.get_memory_graph(u_id)

    assert res == {"nodes": [], "edges": []}


@pytest.mark.asyncio
async def test_get_memory_graph_populated(memory_service: MemoryService):
    """Test get_memory_graph_populated.


    Args: None

    Returns: None

    """
    u_id = uuid4()

    # Arrange DB facts
    m1 = Memory(content="m1", user_id=u_id, embedding=[0.0])
    m2 = Memory(content="m2", user_id=u_id, embedding=[0.0])
    await m1.save()
    await m2.save()

    edge = await MemoryRelationship.create(
        source_id=m1.id, target_id=m2.id, relationship_type="RELATED_TO"
    )

    # Act
    res = await memory_service.get_memory_graph(u_id)

    # Assert
    assert {n.id for n in res["nodes"]} == {m1.id, m2.id}
    assert len(res["nodes"]) == 2
    assert len(res["edges"]) == 1
    assert res["edges"][0].id == edge.id


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_with_query(
    mock_embed: AsyncMock, memory_service: MemoryService
) -> None:

    mock_vector = [0.1, 0.2, 0.3]
    mock_embed.return_value = mock_vector

    u_id = uuid4()
    a_id = uuid4()
    r_id = uuid4()

    mock_memory = Memory(content="match", embedding=[0.1], user_id=u_id)

    # Mock match_memories because pgvector match is not supported in sqlite
    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = [mock_memory]

        res = await memory_service.retrieve_memories(
            "test query", user_id=u_id, agent_id=a_id, room_id=r_id
        )

        assert res == [mock_memory]
        mock_embed.assert_awaited_once_with("test query")
        from app.domain.memory.service import TOP_K

        mock_match.assert_awaited_once_with(mock_vector, 0.0, TOP_K, u_id, a_id, r_id)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_empty_query(
    mock_embed: AsyncMock, memory_service: MemoryService
) -> None:

    u_id = uuid4()

    mock_memory = Memory(content="match", embedding=[0.1], user_id=u_id)

    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = [mock_memory]

        res = await memory_service.retrieve_memories("", user_id=u_id)

        assert res == [mock_memory]
        mock_embed.assert_not_called()
        from app.domain.memory.service import TOP_K

        mock_match.assert_awaited_once_with([0.0] * 1536, 0.0, TOP_K, u_id, None, None)
