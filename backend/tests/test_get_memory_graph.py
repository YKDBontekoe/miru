from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.memory.service import MemoryService


@pytest.mark.asyncio
async def test_get_memory_graph_empty_memories() -> None:
    mock_repo = AsyncMock()
    mock_repo.list_all_memories.return_value = []
    # If memories is empty, m_ids will be []
    mock_repo.get_relationships_subgraph.return_value = []

    service = MemoryService(mock_repo)
    res = await service.get_memory_graph(uuid4())
    assert res == {"nodes": [], "edges": []}
    mock_repo.get_relationships_subgraph.assert_not_called()
