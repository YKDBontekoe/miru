from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.service import MemoryService


@pytest.mark.asyncio
async def test_store_memory_empty_content() -> None:
    from app.infrastructure.repositories.memory_repo import MemoryRepository

    repo = MemoryRepository()
    service = MemoryService(repo)

    result = await service.store_memory("")
    assert result is None
    result_spaces = await service.store_memory("   ")
    assert result_spaces is None


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_deduplicated(mock_embed: AsyncMock) -> None:
    from app.infrastructure.repositories.memory_repo import MemoryRepository
    from app.domain.memory.models import Memory

    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536

    # Simulate existing memory found by match_memories since we can't test pgvector here
    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = [Memory(id=uuid4(), content="A known fact")]

        result = await service.store_memory("A known fact")
        assert result is None
        mock_match.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch(
    "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
    new_callable=AsyncMock,
)
@patch("asyncio.create_task")
async def test_store_memory_success(
    mock_create_task: MagicMock,
    mock_process_and_store_graph: AsyncMock,
    mock_embed: AsyncMock,
) -> None:
    from app.domain.memory.models import Memory, MemoryRelationship
    from app.infrastructure.repositories.memory_repo import MemoryRepository

    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536

    # We need to mock match_memories because it relies on pgvector raw SQL,
    # which the sqlite test fixture does not support.
    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []

        user_id = uuid4()
        related_id = uuid4()

        # Seed related memory to satisfy foreign key constraints if they existed
        # (MemoryRelationship doesn't strictly enforce in sqlite, but good practice)
        await Memory.create(id=related_id, content="related", embedding=[0.0] * 1536)

        result_id = await service.store_memory(
            content="A new fact about user",
            user_id=user_id,
            related_to=[related_id],
        )

        assert result_id is not None

        # Verify side effects
        stored_memory = await Memory.get_or_none(id=result_id)
        assert stored_memory is not None
        assert stored_memory.content == "A new fact about user"
        assert stored_memory.user_id == user_id

        # Verify relationship creation
        relationships = await MemoryRelationship.filter(source_id=result_id).all()
        assert len(relationships) == 1
        assert relationships[0].target_id == related_id

        # Verify background task scheduling
        mock_create_task.assert_called_once()
        mock_process_and_store_graph.assert_called_once_with("A new fact about user", user_id)


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.domain.memory.service.logger")
async def test_store_memory_chaos_relationship_failure(
    mock_logger: MagicMock, mock_embed: AsyncMock
) -> None:
    from app.infrastructure.repositories.memory_repo import MemoryRepository
    from app.domain.memory.models import Memory

    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []
        with patch.object(repo, "create_relationship", new_callable=AsyncMock) as mock_rel:
            mock_rel.side_effect = Exception("DB disconnected")

            result = await service.store_memory(
                content="Fact",
                related_to=[uuid4()],
            )

            assert result is not None
            mock_logger.warning.assert_called_with("Relationship creation failed: DB disconnected")


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.domain.memory.service.logger")
@patch("asyncio.create_task")
async def test_store_memory_chaos_background_task_failure(
    mock_create_task: MagicMock, mock_logger: MagicMock, mock_embed: AsyncMock
) -> None:
    from app.infrastructure.repositories.memory_repo import MemoryRepository
    from app.domain.memory.models import Memory

    repo = MemoryRepository()
    service = MemoryService(repo)

    mock_embed.return_value = [0.1] * 1536

    with patch.object(repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = []
        mock_create_task.side_effect = Exception("Event loop closed")

        result = await service.store_memory(
            content="Fact",
            user_id=uuid4(),
        )

        assert result is not None
        mock_logger.warning.assert_called_with(
            "Failed to trigger background graph extraction", exc_info=True
        )


@pytest.mark.asyncio
async def test_get_memory_graph_success() -> None:
    from app.domain.memory.models import Memory, MemoryRelationship
    from app.infrastructure.repositories.memory_repo import MemoryRepository

    repo = MemoryRepository()
    service = MemoryService(repo)

    user_id = uuid4()
    mem1_id = uuid4()
    mem2_id = uuid4()

    await Memory.create(id=mem1_id, user_id=user_id, content="Node 1", embedding=[0.1] * 1536)
    await Memory.create(id=mem2_id, user_id=user_id, content="Node 2", embedding=[0.2] * 1536)
    await MemoryRelationship.create(
        source_id=mem1_id, target_id=mem2_id, relationship_type="RELATED_TO"
    )

    result = await service.get_memory_graph(user_id)

    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) == 2
    assert len(result["edges"]) == 1
    assert result["nodes"][0].content in ["Node 1", "Node 2"]
    assert result["edges"][0].source_id == mem1_id
    assert result["edges"][0].target_id == mem2_id


@pytest.mark.asyncio
async def test_get_memory_graph_empty() -> None:
    from app.infrastructure.repositories.memory_repo import MemoryRepository

    repo = MemoryRepository()
    service = MemoryService(repo)

    result = await service.get_memory_graph(uuid4())

    assert result == {"nodes": [], "edges": []}


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_retrieve_memories_with_query(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_embed.return_value = [0.5] * 1536
    mock_repo.match_memories.return_value = [{"id": uuid4()}]

    user_id = uuid4()
    agent_id = uuid4()
    room_id = uuid4()

    result = await service.retrieve_memories(
        query="test query",
        user_id=user_id,
        agent_id=agent_id,
        room_id=room_id,
    )

    assert len(result) == 1
    mock_embed.assert_called_once_with("test query")
    mock_repo.match_memories.assert_awaited_once_with(
        [0.5] * 1536, 0.0, 5, user_id, agent_id, room_id
    )


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_retrieve_memories_empty_query(mock_embed: AsyncMock) -> None:
    mock_repo = AsyncMock()
    service = MemoryService(mock_repo)

    mock_repo.match_memories.return_value = []

    result = await service.retrieve_memories(query="")

    assert len(result) == 0
    mock_embed.assert_not_called()
    mock_repo.match_memories.assert_awaited_once_with([0.0] * 1536, 0.0, 5, None, None, None)


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
