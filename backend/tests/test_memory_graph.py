import pytest

from app.infrastructure.repositories.memory_repo import MemoryRepository


@pytest.mark.asyncio
async def test_get_relationships_subgraph_empty():
    repo = MemoryRepository()
    result = await repo.get_relationships_subgraph([])
    assert result == []
