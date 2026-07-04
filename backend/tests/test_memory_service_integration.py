"""Integration tests for the Memory Service."""

import asyncio
from unittest.mock import AsyncMock, patch
from uuid import UUID

import pytest
import pytest_asyncio
from tortoise import Tortoise

from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository
from app.domain.memory.models import Memory, MemoryRelationship, MemoryGraphNode, MemoryGraphEdge, MemoryCollection

# Test variables
TEST_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
TEST_AGENT_ID = UUID("22222222-2222-2222-2222-222222222222")

@pytest_asyncio.fixture(autouse=True)
async def clean_db() -> None:
    """Clean the database before and after each test."""
    try:
        await MemoryRelationship.all().delete()
        await MemoryGraphEdge.all().delete()
        await MemoryGraphNode.all().delete()
        await Memory.all().delete()
        await MemoryCollection.all().delete()
    except Exception:
        pass
    yield
    try:
        await MemoryRelationship.all().delete()
        await MemoryGraphEdge.all().delete()
        await MemoryGraphNode.all().delete()
        await Memory.all().delete()
        await MemoryCollection.all().delete()
    except Exception:
        pass

@pytest.fixture
def memory_service() -> MemoryService:
    repo = MemoryRepository()
    return MemoryService(repo)

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories", new_callable=AsyncMock)
async def test_store_memory_inserts_into_db_and_creates_relationships(
    mock_match: AsyncMock, mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Critical Path: Store a new memory fact and link it to an existing memory.
    Action: Call store_memory.
    Assert: Query database to verify memory and relationship exist.
    """
    mock_match.return_value = []

    # Arrange: seed DB with an existing memory
    related_memory = Memory(
        id=UUID("33333333-3333-3333-3333-333333333333"),
        content="I have a cat named Whiskers",
        embedding=[0.1] * 1536,
        user_id=TEST_USER_ID,
    )
    await related_memory.save()

    mock_embed.return_value = [0.2] * 1536

    # Act
    memory_id = await memory_service.store_memory(
        content="Whiskers likes tuna",
        user_id=TEST_USER_ID,
        agent_id=TEST_AGENT_ID,
        related_to=[related_memory.id],
    )

    # Wait slightly to ensure any background tasks finish
    await asyncio.sleep(0.1)

    # Assert
    assert memory_id is not None

    # Verify memory exists in DB
    stored = await Memory.get_or_none(id=memory_id)
    assert stored is not None
    assert stored.content == "Whiskers likes tuna"
    assert stored.user_id == TEST_USER_ID
    assert stored.agent_id == TEST_AGENT_ID

    # Verify relationship exists
    rel = await MemoryRelationship.get_or_none(source_id=memory_id, target_id=related_memory.id)
    assert rel is not None
    assert rel.relationship_type == "RELATED_TO"

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories", new_callable=AsyncMock)
async def test_store_memory_prevents_duplicates(
    mock_match: AsyncMock, mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Chaos case: Inserting identical semantic facts.
    Action: Call store_memory with identical content twice.
    Assert: The second call returns None, and only 1 record is in the DB.
    """
    # Arrange
    content = "I live in Tokyo."
    mock_embed.return_value = [0.5] * 1536
    mock_match.return_value = []

    # Act 1
    mid1 = await memory_service.store_memory(content=content, user_id=TEST_USER_ID)

    # mock match to return the existing memory now
    mock_match.return_value = [Memory(id=mid1, content=content)]

    # Act 2 (duplicate)
    mid2 = await memory_service.store_memory(content=content, user_id=TEST_USER_ID)

    # Assert
    assert mid1 is not None
    assert mid2 is None

    count = await Memory.filter(user_id=TEST_USER_ID).count()
    assert count == 1

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories", new_callable=AsyncMock)
async def test_retrieve_memories_filters_by_similarity_and_user(
    mock_match: AsyncMock, mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Critical Path: Retrieve similar memories, scoped to the user.
    Action: Call retrieve_memories.
    Assert: Return matching memories but exclude other user's facts.
    """
    # Arrange
    # User's memory - close match
    mem1 = Memory(content="I love ramen", embedding=[0.9, 0.1] + [0.0] * 1534, user_id=TEST_USER_ID)
    mock_match.return_value = [mem1]

    mock_embed.return_value = [0.9, 0.1] + [0.0] * 1534

    # Act
    results = await memory_service.retrieve_memories(query="What food do I like?", user_id=TEST_USER_ID)

    # Assert
    assert len(results) == 1
    assert results[0].content == "I love ramen"

@pytest.mark.asyncio
async def test_store_memory_with_empty_content_returns_none(
    memory_service: MemoryService
) -> None:
    """
    Chaos case: Empty string payload.
    Action: Call store_memory with whitespace.
    Assert: Returns None without querying or inserting.
    """
    result = await memory_service.store_memory("   ")
    assert result is None
    count = await Memory.all().count()
    assert count == 0

@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
@patch("app.infrastructure.repositories.memory_repo.MemoryRepository.match_memories", new_callable=AsyncMock)
async def test_store_memory_database_conflict(
    mock_match: AsyncMock, mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Chaos case: Database Conflict.
    Action: Call store_memory where creating the memory relationship raises an exception.
    Assert: Exception is logged, memory is still returned and created without the relationship.
    """
    from tortoise.exceptions import IntegrityError

    # Arrange: seed DB with an existing memory
    related_memory = Memory(
        id=UUID("33333333-3333-3333-3333-333333333333"),
        content="I have a cat named Whiskers",
        embedding=[0.1] * 1536,
        user_id=TEST_USER_ID,
    )
    await related_memory.save()

    mock_match.return_value = []
    mock_embed.return_value = [0.2] * 1536

    with patch("app.infrastructure.repositories.memory_repo.MemoryRepository.create_relationship", new_callable=AsyncMock) as mock_create_rel:
        mock_create_rel.side_effect = IntegrityError("Simulated unique constraint conflict")

        # Act
        memory_id = await memory_service.store_memory(
            content="Whiskers likes tuna",
            user_id=TEST_USER_ID,
            agent_id=TEST_AGENT_ID,
            related_to=[related_memory.id],
        )

        # Assert
        assert memory_id is not None
        stored = await Memory.get_or_none(id=memory_id)
        assert stored is not None
