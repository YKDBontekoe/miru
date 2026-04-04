from __future__ import annotations

import asyncio
from unittest.mock import patch
from uuid import uuid4

import pytest

from app.domain.memory.models import Memory
from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository


@pytest.mark.asyncio
@pytest.mark.integration
async def test_memory_creation_and_retrieval_integration() -> None:
    """Integration test to verify pgvector insertion and match_memories RPC logic.

    This follows the Miru Test Standards:
    - Arrange: Seed database via the API or direct repo
    - Act: Call the Application Use Case
    - Assert: Query the database directly to verify the side effect
    """
    repo = MemoryRepository()
    service = MemoryService(repo)

    user_id = uuid4()

    # Arrange/Act: Store memories with mocked embed so we control exactly what goes in.
    # Note: match_memories uses a cosine distance > threshold check.
    # To bypass it we ensure vectors are different enough, or just let deduplication do its thing.

    with patch("app.domain.memory.service.embed") as mock_embed:
        # First memory
        mock_embed.return_value = [0.1] * 1536
        mem1_id = await service.store_memory(
            content="I have a cat named Whiskers", user_id=user_id
        )

        # Second memory
        mock_embed.return_value = [0.2] * 1536
        mem2_id = await service.store_memory(
            content="I like to drink coffee in the morning", user_id=user_id
        )

        # Deduplication case - should return None because vector is exactly [0.1]*1536
        mock_embed.return_value = [0.1] * 1536
        mem3_id = await service.store_memory(
            content="I own a cat whose name is Whiskers", user_id=user_id
        )

    assert mem1_id is not None
    assert mem2_id is not None
    assert mem3_id is None  # Deduplicated

    # Assert: Query database directly
    stored_memories = await Memory.filter(user_id=user_id).all()
    assert len(stored_memories) == 2

    # Assert side effects using the service's retrieve_memories
    with patch("app.domain.memory.service.embed") as mock_embed:
        mock_embed.return_value = [0.1] * 1536
        results = await service.retrieve_memories(query="cat", user_id=user_id)
        assert len(results) >= 1
        assert results[0].id == mem1_id


@pytest.mark.asyncio
@pytest.mark.integration
async def test_memory_relationship_integration() -> None:
    """Verify relationships are properly saved and deleted via graph endpoints."""
    repo = MemoryRepository()
    service = MemoryService(repo)

    user_id = uuid4()

    with patch("app.domain.memory.service.embed") as mock_embed:
        mock_embed.return_value = [0.3] * 1536
        m1 = await service.store_memory("Paris is a city", user_id=user_id)

        mock_embed.return_value = [0.4] * 1536
        m2 = await service.store_memory("France is a country", user_id=user_id, related_to=[m1])

    assert m1 is not None
    assert m2 is not None

    graph = await service.get_memory_graph(user_id)
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1

    # Verify deletion removes the relationship and the node
    await service.delete_memory(m1, user_id=user_id)

    graph_after = await service.get_memory_graph(user_id)
    assert len(graph_after["nodes"]) == 1
    assert len(graph_after["edges"]) == 0


@pytest.mark.asyncio
@pytest.mark.integration
async def test_store_memory_triggers_graph_extraction_integration() -> None:
    """Verify background task logic for graph extraction using real db operations."""
    repo = MemoryRepository()
    service = MemoryService(repo)
    user_id = uuid4()

    from app.domain.memory.graph_service import (
        GraphEntity,
        GraphExtractionSchema,
    )

    mock_extraction = GraphExtractionSchema(
        entities=[
            GraphEntity(name="John", entity_type="Person", description="A cool dude"),
        ],
        relationships=[]
    )

    with patch("app.domain.memory.service.embed") as mock_embed, \
         patch("app.domain.memory.graph_service.GraphExtractionService.extract_graph_from_text") as mock_extract:
        mock_embed.return_value = [0.5] * 1536
        mock_extract.return_value = mock_extraction

        await service.store_memory("John is a cool dude", user_id=user_id)

        # Allow the background task created by store_memory to execute
        await asyncio.sleep(0.1)

    from app.domain.memory.models import MemoryGraphNode
    nodes = await MemoryGraphNode.filter(user_id=user_id).all()
    assert len(nodes) == 1
    assert nodes[0].name == "John"
    assert nodes[0].entity_type == "Person"
