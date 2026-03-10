from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.memory import _search_memories_by_vector


@pytest.mark.asyncio
async def test_search_memories_by_vector() -> None:
    # Mock embed and get_supabase
    with (
        patch("app.memory.embed", new_callable=AsyncMock) as mock_embed,
        patch("app.memory.get_supabase") as mock_supabase_getter,
    ):
        mock_embed.return_value = [0.1, 0.2, 0.3]
        mock_supabase = MagicMock()
        mock_supabase_getter.return_value = mock_supabase

        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = [{"id": "1", "content": "mock_memory"}]
        mock_supabase.rpc.return_value = mock_rpc

        result = await _search_memories_by_vector("test query", 2)

        assert result == [{"id": "1", "content": "mock_memory"}]
        mock_embed.assert_awaited_once_with("test query")
        mock_supabase.rpc.assert_called_once_with(
            "match_memories",
            {"query_embedding": [0.1, 0.2, 0.3], "match_threshold": 0.0, "match_count": 2},
        )
