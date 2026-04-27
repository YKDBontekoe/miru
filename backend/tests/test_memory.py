from __future__ import annotations

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.infrastructure.repositories.memory_repo import MemoryRepository


@pytest.mark.asyncio
async def test_match_memories_sql_types() -> None:
    repo = MemoryRepository()
    mock_conn = AsyncMock()
    mock_conn.execute_query_dict = AsyncMock(
        return_value=[
            {
                "id": "00000000-0000-0000-0000-000000000000",
                "content": "hi",
                "embedding": "[0.1]",
                "similarity": 0.9,
            }
        ]
    )
    uid = uuid4()
    aid = uuid4()
    rid = uuid4()
    with patch("app.infrastructure.repositories.memory_repo.Tortoise") as mock_tortoise:
        mock_tortoise.get_connection.return_value = mock_conn
        result = await repo.match_memories([0.1, 0.2], 0.5, 5, uid, aid, rid)
    assert len(result) == 1
    assert result[0].content == "hi"
    assert not hasattr(result[0], "similarity")
    mock_conn.execute_query_dict.assert_awaited_once()
    call_args = mock_conn.execute_query_dict.call_args
    sql_query = call_args[0][0]

    assert "$1::vector" in sql_query
    assert "$2::float" in sql_query
    assert "$3::int" in sql_query
    assert "$4::uuid" in sql_query
    assert "$5::uuid" in sql_query
    assert "$6::uuid" in sql_query
