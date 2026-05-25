from __future__ import annotations

from unittest.mock import AsyncMock, patch
from uuid import UUID

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# ---------------------------------------------------------------------------
# Miru Test Standards: Integration-First
# ---------------------------------------------------------------------------


@pytest.fixture
def memory_repo() -> MemoryRepository:
    """Create and return a MemoryRepository instance.

    Returns:
        MemoryRepository: The instantiated repository.
    """
    return MemoryRepository()


@pytest.fixture
def memory_service(memory_repo: MemoryRepository) -> MemoryService:
    """Create and return a MemoryService instance.

    Args:
        memory_repo: The repository to inject.

    Returns:
        MemoryService: The instantiated service.
    """
    return MemoryService(memory_repo)


@pytest.mark.asyncio

# TEST(miru-agent): refactor-required
async def test_store_memory_creates_new_memory_and_triggers_graph(
    memory_service: MemoryService,
) -> None:
    """Verify storing a new memory persists and triggers graph extraction.

    Args:
        memory_service: The service to test.
    """
    # Arrange
    user_id = UUID("267d2b96-6be3-45e2-b482-eb575dc26e98")
    content = "I really enjoy playing the guitar."

    # We mock match_memories to return empty, forcing a new insert.
    # We also mock embed, and the background task triggered for graph extraction.
    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
        patch("asyncio.create_task") as mock_create_task,
        patch(
            "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
            new_callable=AsyncMock,  # Mocking coroutine itself is correct per memory instruction
        ) as _,
    ):
        mock_match.return_value = []
        mock_embed.return_value = [0.1] * 1536

        # Act
        memory_id = await memory_service.store_memory(content=content, user_id=user_id)

        # Assert Side Effects in DB
        assert memory_id is not None
        saved_memory = await Memory.get_or_none(id=memory_id)
        assert saved_memory is not None
        assert saved_memory.content == content
        assert saved_memory.user_id == user_id

        # Assert Background Tasks
        mock_create_task.assert_called_once()
        _.assert_called_once_with(content, user_id)

        # Await the created task to prevent unawaited coroutine warnings
        created_coro = mock_create_task.call_args[0][0]
        await created_coro


@pytest.mark.asyncio
async def test_store_memory_deduplication(memory_service: MemoryService) -> None:
    """Verify storing a duplicate memory returns early and skips insert.

    Args:
        memory_service: The service to test.
    """
    # Arrange
    user_id = UUID("ea62c5d2-5642-4377-9afa-af0d345b8099")
    content = "I really enjoy playing the guitar."

    # Seed an existing memory
    existing_memory = await Memory.create(
        id=UUID("e929dd97-ce83-4e35-a9c5-f65e2344aa2e"),
        content="I love playing guitar",
        embedding=[0.1] * 1536,
        user_id=user_id,
    )

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
    ):
        # Mock match_memories to return the existing memory
        mock_match.return_value = [existing_memory]
        mock_embed.return_value = [0.1] * 1536

        # Act
        memory_id = await memory_service.store_memory(content=content, user_id=user_id)

        # Assert no new memory was created
        assert memory_id is None
        total_memories = await Memory.filter(user_id=user_id).count()
        assert total_memories == 1


@pytest.mark.asyncio

# TEST(miru-agent): refactor-required
async def test_store_memory_creates_relationships(memory_service: MemoryService) -> None:
    """Verify storing a memory creates the expected relationships.

    Args:
        memory_service: The service to test.
    """
    # Arrange
    user_id = UUID("ba2c070d-f245-4fd9-af82-9350c9b38656")
    content = "This memory is related."
    related_memory_1 = await Memory.create(
        id=UUID("e99df037-5028-4a8a-8d5b-d207b8e39f53"),
        content="Related 1",
        embedding=[0.1] * 1536,
        user_id=user_id,
    )
    related_memory_2 = await Memory.create(
        id=UUID("e58cbe57-782e-4e86-98a1-c9fe4764fb67"),
        content="Related 2",
        embedding=[0.1] * 1536,
        user_id=user_id,
    )

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
        patch("asyncio.create_task") as mock_create_task,
        patch(
            "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
            new_callable=AsyncMock,
        ) as _,
    ):
        mock_match.return_value = []
        mock_embed.return_value = [0.1] * 1536

        # Act
        memory_id = await memory_service.store_memory(
            content=content, user_id=user_id, related_to=[related_memory_1.id, related_memory_2.id]
        )

        # Assert Relationships
        assert memory_id is not None
        relationships = await MemoryRelationship.filter(source_id=memory_id).all()
        assert len(relationships) == 2

        target_ids = {getattr(rel, "target_id") for rel in relationships}  # noqa: B009
        assert related_memory_1.id in target_ids
        assert related_memory_2.id in target_ids

        # Clean up unawaited coroutine warning
        created_coro = mock_create_task.call_args[0][0]
        await created_coro


@pytest.mark.asyncio

# TEST(miru-agent): refactor-required
async def test_store_memory_handles_relationship_creation_error(
    memory_service: MemoryService,
) -> None:
    # Arrange: Chaos case
    user_id = UUID("9871064e-95cf-46f2-b2da-50d3efed599a")
    content = "This memory relates to a missing memory."
    missing_memory_id = UUID(
        "c2b62199-88dc-4130-8915-a76f8f2013e7"
    )  # Doesn't exist, will cause IntegrityError during FK creation

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
        patch("asyncio.create_task") as mock_create_task,
        patch(
            "app.domain.memory.graph_service.GraphExtractionService.process_and_store_graph",
            new_callable=AsyncMock,
        ) as _,
    ):
        mock_match.return_value = []
        mock_embed.return_value = [0.1] * 1536

        # Act
        # It should handle the exception gracefully and still return the memory_id
        memory_id = await memory_service.store_memory(
            content=content, user_id=user_id, related_to=[missing_memory_id]
        )

        # Assert Memory Created but no Relationships
        assert memory_id is not None
        relationships = await MemoryRelationship.filter(source_id=memory_id).all()
        assert len(relationships) == 0

        # Clean up unawaited coroutine warning
        created_coro = mock_create_task.call_args[0][0]
        await created_coro


@pytest.mark.asyncio
async def test_retrieve_memories_calls_match_memories(memory_service: MemoryService) -> None:
    """Verify retrieving memories delegates to match_memories correctly.

    Args:
        memory_service: The service to test.
    """
    # Arrange
    user_id = UUID("c7290d2a-6d7a-4f24-a1b2-5cea08b77064")
    query = "Search query"
    expected_memory = Memory(
        id=UUID("eef6f6fd-968c-4901-b5d7-cb9e9232d283"), content="Result", embedding=[0.1] * 1536
    )

    with (
        patch(
            "app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories",
            new_callable=AsyncMock,
        ) as mock_match,
        patch("app.domain.memory.service.embed", new_callable=AsyncMock) as mock_embed,
    ):
        mock_match.return_value = [expected_memory]
        mock_embed.return_value = [0.5] * 1536

        # Act
        results = await memory_service.retrieve_memories(query=query, user_id=user_id)

        # Assert
        assert len(results) == 1
        assert results[0].content == "Result"
        mock_embed.assert_called_once_with(query)
        mock_match.assert_called_once()
        # Verify it passed the user_id correctly to match_memories
        call_args = mock_match.call_args[0]
        assert call_args[3] == user_id


@pytest.mark.asyncio
async def test_get_memory_graph_returns_nodes_and_edges(memory_service: MemoryService) -> None:
    """Verify fetching the memory graph returns nodes and edges.

    Args:
        memory_service: The service to test.
    """
    # Arrange
    user_id = UUID("192b48b6-043f-46dd-b697-df6367feb0b7")

    mem1 = await Memory.create(
        id=UUID("5df3defb-c240-4644-a64b-a388afe05aaa"),
        content="Mem 1",
        embedding=[0.1] * 1536,
        user_id=user_id,
    )
    mem2 = await Memory.create(
        id=UUID("94f221a2-e5ce-4c93-ad09-7b8eabef21ed"),
        content="Mem 2",
        embedding=[0.1] * 1536,
        user_id=user_id,
    )

    rel = await MemoryRelationship.create(
        source_id=mem1.id, target_id=mem2.id, relationship_type="RELATED"
    )

    # Act
    graph = await memory_service.get_memory_graph(user_id=user_id)

    # Assert
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1

    node_ids = {n.id for n in graph["nodes"]}
    assert mem1.id in node_ids
    assert mem2.id in node_ids

    assert graph["edges"][0].id == rel.id
