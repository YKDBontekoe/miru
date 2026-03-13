from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.domain.memory.models import Memory, MemoryRelationship
from app.domain.memory.service import MemoryService


@pytest.mark.asyncio
async def test_get_memory_graph_service():
    user_id = uuid4()
    memory_id = uuid4()

    mock_memory = Memory(
        id=memory_id,
        user_id=user_id,
        content="Service memory",
        embedding=[0.3, 0.4],
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    mock_rel = MemoryRelationship(
        id=uuid4(),
        source_id=memory_id,
        target_id=memory_id,
        relationship_type="SIMILAR_TO",
        weight=0.9,
        meta={},
        created_at=datetime.now(UTC),
    )

    mock_repo = MagicMock()
    mock_repo.list_all_memories = AsyncMock(return_value=[mock_memory])
    mock_repo.get_relationships_subgraph = AsyncMock(return_value=[mock_rel])

    service = MemoryService(repo=mock_repo)

    result = await service.get_memory_graph(user_id)

    assert len(result.nodes) == 1
    assert result.nodes[0].id == memory_id
    assert len(result.edges) == 1
    assert result.edges[0].relationship_type == "SIMILAR_TO"

    mock_repo.list_all_memories.assert_called_once_with(user_id)
    mock_repo.get_relationships_subgraph.assert_called_once_with([memory_id])
