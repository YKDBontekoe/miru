"""Memory API router v1."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_memory_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.memory.models import Memory, MemoryRequest  # noqa: TCH001
from app.domain.memory.service import MemoryService  # noqa: TCH001

if TYPE_CHECKING:
    from uuid import UUID

router = APIRouter(tags=["Memory"])


@router.get("/", response_model=dict[str, list[Memory]])
async def list_memories(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, list[Memory]]:
    """Retrieve top memories for the current user."""
    memories = await service.retrieve_memories(query="", user_id=user_id)
    return {"memories": memories}


@router.get("/graph", response_model=dict[str, Any])
async def get_memory_graph(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, Any]:
    """Fetch the memory graph for the current user."""
    return await service.get_memory_graph(user_id)


@router.post("/")
async def store_memory(
    data: MemoryRequest,
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, Any]:
    """Manually store a new memory."""
    memory_id = await service.store_memory(content=data.message, user_id=user_id)
    return {"status": "ok", "id": str(memory_id)}


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, str]:
    """Delete a memory."""
    success = await service.delete_memory(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "ok"}
