from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.memory import delete_memory


@pytest.mark.asyncio
async def test_delete_memory_success() -> None:
    service = AsyncMock()
    service.delete_memory.return_value = True
    result = await delete_memory(uuid4(), uuid4(), service)
    assert result == {"status": "ok"}


@pytest.mark.asyncio
async def test_delete_memory_not_found() -> None:
    service = AsyncMock()
    service.delete_memory.return_value = False
    with pytest.raises(HTTPException) as exc_info:
        await delete_memory(uuid4(), uuid4(), service)
    assert exc_info.value.status_code == 404
