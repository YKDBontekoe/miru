"""Integration tests for the Memory Service."""

import asyncio
import os
from unittest.mock import AsyncMock, patch
from uuid import UUID

import pytest
import pytest_asyncio
from tortoise import Tortoise

from app.domain.memory.models import (
    Memory,
    MemoryCollection,
    MemoryGraphEdge,
    MemoryGraphNode,
    MemoryRelationship,
)
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository

# Must disable ryuk for the testcontainer to start properly in some environments
os.environ["TESTCONTAINERS_RYUK_DISABLED"] = "true"

# Test variables
TEST_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
TEST_AGENT_ID = UUID("22222222-2222-2222-2222-222222222222")


class CIPostgresContainer:
    """A mock container for GitHub Actions CI which already runs a pgvector service."""

    def get_connection_url(self, driver="asyncpg"):
        return os.environ.get("DATABASE_URL")


@pytest.fixture(scope="session")
def postgres_container():
    """Spin up a real Postgres container for integration tests."""
    # In CI, we use the postgres instance spawned by the github action services block instead of
    # testcontainers. It is accessible at the env var DATABASE_URL.
    if os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("DATABASE_URL"):
        yield CIPostgresContainer()
    else:
        from testcontainers.postgres import PostgresContainer

        try:
            with PostgresContainer("pgvector/pgvector:pg16") as postgres:
                yield postgres
        except Exception:
            yield None


@pytest_asyncio.fixture(autouse=True)
async def skip_if_no_postgres(postgres_container):
    if postgres_container is None:
        if os.environ.get("GITHUB_ACTIONS") == "true":
            pytest.fail("Failed to connect to Postgres container in CI environment.")
        else:
            pytest.skip(
                "Skipping test because real Postgres container could not be started in this environment."
            )


@pytest_asyncio.fixture(autouse=True)
async def initialize_tortoise_pg(postgres_container, skip_if_no_postgres) -> None:
    """Initialize Tortoise ORM with the Postgres connection."""
    db_url = postgres_container.get_connection_url(driver="asyncpg")

    # We must patch Tortoise ORM to use the asyncpg dialect
    # instead of postgres for proper async integration
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgres://")

    config = {
        "connections": {"default": db_url},
        "apps": {
            "models": {
                "models": [
                    "app.domain.agents.models",
                    "app.infrastructure.database.models.chat_models",
                    "app.domain.memory.models",
                    "app.domain.agent_tools.models",
                    "app.infrastructure.database.models.auth_models",
                    "app.domain.productivity.models",
                ],
                "default_connection": "default",
            }
        },
    }

    await Tortoise.init(config=config)
    conn = Tortoise.get_connection("default")
    await conn.execute_script("CREATE EXTENSION IF NOT EXISTS vector;")
    await Tortoise.generate_schemas()

    yield

    await Tortoise.close_connections()


@pytest_asyncio.fixture(autouse=True)
async def clean_db(skip_if_no_postgres) -> None:
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
async def test_store_memory_inserts_into_db_and_creates_relationships(
    mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Critical Path: Store a new memory fact and link it to an existing memory.
    Action: Call store_memory.
    Assert: Query database to verify memory and relationship exist.
    """
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
    rel = await MemoryRelationship.get_or_none(
        source_id=memory_id, target_id=related_memory.id
    )
    assert rel is not None
    assert rel.relationship_type == "RELATED_TO"


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_store_memory_prevents_duplicates(
    mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Chaos case: Inserting identical semantic facts.
    Action: Call store_memory with identical content twice.
    Assert: The second call returns None, and only 1 record is in the DB.
    """
    # Arrange
    content = "I live in Tokyo."
    mock_embed.return_value = [0.5] * 1536

    # Act 1
    mid1 = await memory_service.store_memory(content=content, user_id=TEST_USER_ID)

    # Act 2 (duplicate)
    mid2 = await memory_service.store_memory(content=content, user_id=TEST_USER_ID)

    # Assert
    assert mid1 is not None
    assert mid2 is None

    count = await Memory.filter(user_id=TEST_USER_ID).count()
    assert count == 1


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed", new_callable=AsyncMock)
async def test_retrieve_memories_filters_by_similarity_and_user(
    mock_embed: AsyncMock, memory_service: MemoryService
) -> None:
    """
    Critical Path: Retrieve similar memories, scoped to the user.
    Action: Call retrieve_memories.
    Assert: Return matching memories but exclude other user's facts.
    """
    # Arrange
    # User's memory - close match
    mem1 = Memory(
        content="I love ramen", embedding=[0.9] + [0.0] * 1535, user_id=TEST_USER_ID
    )
    # User's memory - poor match
    mem2 = Memory(
        content="My favorite color is blue",
        embedding=[0.1] + [0.0] * 1535,
        user_id=TEST_USER_ID,
    )
    # Other user's memory - close match
    mem3 = Memory(
        content="I love ramen too",
        embedding=[0.9] + [0.0] * 1535,
        user_id=UUID("44444444-4444-4444-4444-444444444444"),
    )

    await mem1.save()
    await mem2.save()
    await mem3.save()

    mock_embed.return_value = [0.9] + [0.0] * 1535

    # Act
    results = await memory_service.retrieve_memories(
        query="What food do I like?", user_id=TEST_USER_ID
    )

    # Assert
    assert len(results) == 1
    assert results[0].id == mem1.id
    assert results[0].content == "I love ramen"


@pytest.mark.asyncio
async def test_store_memory_with_empty_content_returns_none(
    memory_service: MemoryService,
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
async def test_store_memory_database_conflict() -> None:
    """
    Chaos case: Database Conflict.
    Action: Violate a unique_together constraint on a related model.
    Assert: IntegrityError is raised by Tortoise ORM.
    """
    from tortoise.exceptions import IntegrityError

    node1 = MemoryGraphNode(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        name="n1",
        entity_type="e1",
        user_id=TEST_USER_ID,
    )
    node2 = MemoryGraphNode(
        id=UUID("22222222-2222-2222-2222-222222222222"),
        name="n2",
        entity_type="e2",
        user_id=TEST_USER_ID,
    )
    await node1.save()
    await node2.save()

    edge1 = MemoryGraphEdge(source_node=node1, target_node=node2, relationship="rel")
    await edge1.save()

    with pytest.raises(IntegrityError):
        edge2 = MemoryGraphEdge(
            source_node=node1, target_node=node2, relationship="rel"
        )
        await edge2.save()
