"""Test memory matching repository."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.infrastructure.repositories.memory_repo import MemoryRepository


@pytest.mark.asyncio
async def test_match_memories_sql_types() -> None:
    """Verify that match_memories uses explicit types in SQL query."""
    repo = MemoryRepository()
    mock_conn = AsyncMock()
    mock_conn.execute_query_dict = AsyncMock(return_value=[])

    uid = uuid.uuid4()
    aid = uuid.uuid4()
    rid = uuid.uuid4()

    with patch("app.infrastructure.repositories.memory_repo.Tortoise") as mock_tortoise:
        mock_tortoise.get_connection.return_value = mock_conn
        await repo.match_memories([0.1] * 1536, 0.5, 5, uid, aid, rid)

    mock_conn.execute_query_dict.assert_awaited_once()
    call_args = mock_conn.execute_query_dict.call_args
    sql_query = call_args[0][0]

    assert "$2::float" in sql_query
    assert "$3::int" in sql_query
    assert "$4::uuid" in sql_query
    assert "$5::uuid" in sql_query
    assert "$6::uuid" in sql_query
