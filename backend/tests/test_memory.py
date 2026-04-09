"""Tests for memory endpoints."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.infrastructure.repositories.memory_repo import MemoryRepository


class TestMemoryRepositoryMatchMemories:
    @pytest.mark.asyncio
    async def test_match_memories_delegates_to_raw_sql(self) -> None:
        """match_memories uses raw SQL — mock the connection to verify call."""
        repo = MemoryRepository()
        mock_conn = AsyncMock()
        mock_conn.execute_query_dict = AsyncMock(return_value=[])
        uid = uuid4()
        aid = uuid4()
        rid = uuid4()
        with patch("app.infrastructure.repositories.memory_repo.Tortoise") as mock_tortoise:
            mock_tortoise.get_connection.return_value = mock_conn
            result = await repo.match_memories([0.1, 0.2], 0.5, 5, uid, aid, rid)
        assert result == []
        mock_conn.execute_query_dict.assert_awaited_once()
        call_args = mock_conn.execute_query_dict.call_args
        sql_query = call_args[0][0]
        params = call_args[0][1]

        # Verify the explicit casts are in the SQL string
        assert "$4," in sql_query
        assert "$5," in sql_query
        assert "$6" in sql_query

        # Verify parameters are passed as UUID objects
        assert params[3] == uid
        assert params[4] == aid
        assert params[5] == rid
