from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.memory import delete_memory


@pytest.mark.asyncio
async def test_delete_memory_value_error():
    service = AsyncMock()
    service.delete_memory.side_effect = ValueError("Unauthorized")
    with pytest.raises(HTTPException) as exc_info:
        await delete_memory(uuid4(), uuid4(), service)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Memory not found"
