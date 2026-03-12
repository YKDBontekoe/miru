"""Memory API router v1."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.api.dependencies import get_memory_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.memory.models import MemoryRequest  # noqa: TCH001
from app.domain.memory.service import MemoryService  # noqa: TCH001

router = APIRouter(tags=["Memory"])


@router.get("/")
async def list_memories(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> list[str]:
    """Retrieve top memories for the current user."""
    return await service.retrieve_memories(query="", user_id=user_id)


@router.post("/")
async def store_memory(
    data: MemoryRequest,
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, Any]:
    """Manually store a new memory."""
    memory_id = await service.store_memory(content=data.message, user_id=user_id)
    return {"status": "ok", "id": str(memory_id)}
