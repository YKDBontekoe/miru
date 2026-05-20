import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, patch

from app.domain.memory.models import Memory
from app.infrastructure.repositories.memory_repo import MemoryRepository

class TestMemoryRepositoryBulk:
    @pytest.mark.asyncio
    async def test_bulk_create_relationships_empty(self) -> None:
        repo = MemoryRepository()
        source_id = uuid4()

        # Test empty to_ids
        await repo.bulk_create_relationships(source_id, [])

        # Test only invalid targets
        await repo.bulk_create_relationships(source_id, [source_id, None])
