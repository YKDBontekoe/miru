"""Memory API router v1."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_memory_service

if TYPE_CHECKING:
    from app.core.security.auth import CurrentUser
    from app.domain.memory.models import MemoryRequest
    from app.domain.memory.service import MemoryService

router = APIRouter(tags=["Memory"])

@router.get("/")
async def list_memories(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)]
):
    """Retrieve top memories for the current user."""
    return await service.retrieve_memories(query="", user_id=user_id)

@router.post("/")
async def store_memory(
    data: MemoryRequest,
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)]
):
    """Manually store a new memory."""
    memory_id = await service.store_memory(content=data.message, user_id=user_id)
    return {"status": "ok", "id": memory_id}
