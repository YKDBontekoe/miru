from __future__ import annotations

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.domain.agent_tools.memory_tools import RetrieveMemoryTool, StoreMemoryTool
from app.domain.memory.models import Memory

@pytest.fixture
def store_tool() -> StoreMemoryTool:
    return StoreMemoryTool(user_id=uuid4(), agent_id=uuid4())

@pytest.fixture
def retrieve_tool() -> RetrieveMemoryTool:
    return RetrieveMemoryTool(user_id=uuid4(), agent_id=uuid4())

def test_store_memory_sync_run(store_tool: StoreMemoryTool) -> None:
    with pytest.raises(NotImplementedError):
        store_tool._run("test")

def test_retrieve_memory_sync_run(retrieve_tool: RetrieveMemoryTool) -> None:
    with pytest.raises(NotImplementedError):
        retrieve_tool._run("test")

@pytest.mark.asyncio
async def test_store_memory_success(store_tool: StoreMemoryTool) -> None:
    with patch("app.domain.agent_tools.memory._get_memory_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.store_memory.return_value = uuid4()
        mock_get_service.return_value = mock_service

        result = await store_tool._arun("I like pizza")
        assert result == "Successfully remembered: I like pizza"
        mock_service.store_memory.assert_awaited_once_with(
            content="I like pizza",
            user_id=store_tool.user_id,
            agent_id=store_tool.agent_id,
        )

@pytest.mark.asyncio
async def test_store_memory_failure(store_tool: StoreMemoryTool) -> None:
    with patch("app.domain.agent_tools.memory._get_memory_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.store_memory.return_value = None
        mock_get_service.return_value = mock_service

        result = await store_tool._arun("I like pizza")
        assert result == "Failed to remember or already knew: I like pizza"

@pytest.mark.asyncio
async def test_retrieve_memory_success(retrieve_tool: RetrieveMemoryTool) -> None:
    with patch("app.domain.agent_tools.memory._get_memory_service") as mock_get_service:
        mock_service = AsyncMock()

        memory_id = uuid4()
        m1 = Memory(id=memory_id, content="User likes pizza", embedding=[0.1])

        mock_service.retrieve_memories.return_value = [m1]
        mock_get_service.return_value = mock_service

        result = await retrieve_tool._arun("food")
        assert "User likes pizza" in result
        mock_service.retrieve_memories.assert_awaited_once_with(
            query="food",
            user_id=retrieve_tool.user_id,
        )

@pytest.mark.asyncio
async def test_retrieve_memory_empty(retrieve_tool: RetrieveMemoryTool) -> None:
    with patch("app.domain.agent_tools.memory._get_memory_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.retrieve_memories.return_value = []
        mock_get_service.return_value = mock_service

        result = await retrieve_tool._arun("food")
        assert result == "No relevant memories found."
