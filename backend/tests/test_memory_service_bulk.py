import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, patch

from app.domain.memory.service import MemoryService
from app.domain.memory.models import Memory

class TestMemoryServiceBulk:
    @pytest.mark.asyncio
    @patch("app.domain.memory.service.embed", new_callable=AsyncMock)
    @patch("app.domain.memory.service.logger")
    async def test_store_memory_relationship_failure_logged(self, mock_logger, mock_embed) -> None:
        mock_embed.return_value = [0.1]

        repo_mock = AsyncMock()
        repo_mock.match_memories.return_value = []

        memory_mock = AsyncMock()
        memory_mock.id = uuid4()
        repo_mock.insert_memory.return_value = memory_mock

        repo_mock.bulk_create_relationships.side_effect = Exception("DB error")

        service = MemoryService(repo_mock)
        user_id = uuid4()
        rel_to = [uuid4()]

        await service.store_memory("test", user_id=user_id, related_to=rel_to)

        repo_mock.bulk_create_relationships.assert_awaited_once_with(memory_mock.id, rel_to)
        mock_logger.exception.assert_called_once()
