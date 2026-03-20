from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.domain.memory.models import Memory
from app.domain.memory.service import MemoryService


@pytest.fixture
def mock_repo():
    return AsyncMock()


@pytest.fixture
def memory_service(mock_repo):
    return MemoryService(mock_repo)


@pytest.mark.asyncio
async def test_retrieve_memories_no_query_with_filters(memory_service, mock_repo):
    user_id = uuid4()
    col_id = uuid4()

    expected_mems = [Memory(content="Test", user_id=user_id, embedding=[])]
    mock_repo.list_all_memories.return_value = expected_mems

    result = await memory_service.retrieve_memories(query="", user_id=user_id, collection_id=col_id)

    assert result == expected_mems
    mock_repo.list_all_memories.assert_called_once_with(
        user_id=user_id, collection_id=col_id, start_date=None, end_date=None
    )


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_query_with_collection(mock_embed, memory_service, mock_repo):
    user_id = uuid4()
    col_id = uuid4()

    expected_mems = [Memory(content="Test", user_id=user_id, embedding=[])]
    mock_repo.search_fulltext.return_value = expected_mems

    result = await memory_service.retrieve_memories(
        query="test query", user_id=user_id, collection_id=col_id
    )

    assert result == expected_mems
    mock_repo.search_fulltext.assert_called_once_with("test query", user_id, collection_id=col_id)
    mock_embed.assert_not_called()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_retrieve_memories_query_without_collection(mock_embed, memory_service, mock_repo):
    user_id = uuid4()
    mock_embed.return_value = [0.1, 0.2]

    expected_mems = [Memory(content="Test", user_id=user_id, embedding=[])]
    mock_repo.match_memories.return_value = expected_mems

    result = await memory_service.retrieve_memories(query="test query", user_id=user_id)

    assert result == expected_mems
    mock_repo.match_memories.assert_called_once()


@pytest.mark.asyncio
@patch("app.domain.memory.service.embed")
async def test_update_memory(mock_embed, memory_service, mock_repo):
    mem_id = uuid4()
    mock_embed.return_value = [0.5, 0.5]
    expected_mem = Memory(content="New", embedding=[], id=mem_id)
    mock_repo.update_memory.return_value = expected_mem

    result = await memory_service.update_memory(mem_id, {"content": "New"})

    assert result == expected_mem
    mock_embed.assert_called_once_with("New")
    mock_repo.update_memory.assert_called_once_with(
        mem_id, {"content": "New", "embedding": [0.5, 0.5]}
    )


@pytest.mark.asyncio
async def test_get_on_this_day(memory_service, mock_repo):
    user_id = uuid4()
    mock_repo.get_on_this_day.return_value = []

    result = await memory_service.get_on_this_day(user_id)
    assert result == []
    mock_repo.get_on_this_day.assert_called_once_with(user_id, 10)


@pytest.mark.asyncio
async def test_collection_methods(memory_service, mock_repo):
    user_id = uuid4()
    col_id = uuid4()

    await memory_service.create_collection(user_id, "Test")
    mock_repo.create_collection.assert_called_once_with(user_id, "Test", None)

    await memory_service.list_collections(user_id)
    mock_repo.list_collections.assert_called_once_with(user_id)

    await memory_service.update_collection(col_id, "Updated")
    mock_repo.update_collection.assert_called_once_with(col_id, "Updated", None)

    await memory_service.delete_collection(col_id)
    mock_repo.delete_collection.assert_called_once_with(col_id)


@pytest.mark.asyncio
async def test_merge_memories(memory_service, mock_repo):
    user_id = uuid4()
    m_id1 = uuid4()
    m_id2 = uuid4()
    new_m_id = uuid4()

    memory_service.store_memory = AsyncMock(return_value=new_m_id)
    memory_service.delete_memory = AsyncMock()

    result = await memory_service.merge_memories(user_id, [m_id1, m_id2], "Combined")

    assert result == new_m_id
    memory_service.store_memory.assert_called_once_with(content="Combined", user_id=user_id)
    assert memory_service.delete_memory.call_count == 2


@pytest.mark.asyncio
async def test_export_memories_json(memory_service, mock_repo):
    user_id = uuid4()
    m1 = Memory(id=uuid4(), content="Test 1", user_id=user_id, embedding=[])
    m1.created_at = datetime(2023, 1, 1, tzinfo=UTC)
    mock_repo.list_all_memories.return_value = [m1]

    result = await memory_service.export_memories(user_id, "json")

    import json

    parsed = json.loads(result)
    assert len(parsed) == 1
    assert parsed[0]["content"] == "Test 1"


@pytest.mark.asyncio
async def test_export_memories_csv(memory_service, mock_repo):
    user_id = uuid4()
    m1 = Memory(id=uuid4(), content="Test 1", user_id=user_id, embedding=[])
    m1.created_at = datetime(2023, 1, 1, tzinfo=UTC)
    mock_repo.list_all_memories.return_value = [m1]

    result = await memory_service.export_memories(user_id, "csv")

    assert "Test 1" in result
    assert "id,content,collection_id,created_at" in result
