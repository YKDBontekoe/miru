"""Memory API router v1."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from openai import APIConnectionError

from app.api.dependencies import get_memory_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.memory.models import (
    Memory,
    MemoryCollection,
    MemoryCollectionRequest,
    MemoryCollectionResponse,
    MemoryMergeRequest,
    MemoryRequest,
    MemoryResponse,
    MemoryUpdateRequest,
)  # noqa: TCH001
from app.domain.memory.service import MemoryService  # noqa: TCH001

router = APIRouter(tags=["Memory"])


@router.get("", response_model=dict[str, list[MemoryResponse]])
async def list_memories(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
    query: str = "",
    collection_id: UUID | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> dict[str, list[Memory]]:
    """Retrieve memories for the current user."""
    try:
        memories = await service.retrieve_memories(
            query=query,
            user_id=user_id,
            collection_id=collection_id,
            start_date=start_date,
            end_date=end_date,
        )
        return {"memories": memories}
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e


@router.get("/graph", response_model=dict[str, Any])
async def get_memory_graph(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, Any]:
    """Fetch the memory graph for the current user."""
    try:
        return await service.get_memory_graph(user_id)
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e


@router.post("", response_model=dict[str, Any])
async def store_memory(
    data: MemoryRequest,
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, Any]:
    """Manually store a new memory."""
    try:
        memory_id = await service.store_memory(content=data.message, user_id=user_id)
        return {"status": "ok", "id": str(memory_id)}
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: UUID,
    data: MemoryUpdateRequest,
    _user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> Memory:
    """Update a memory's content or collection."""
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    try:
        memory = await service.update_memory(memory_id, update_data)
        if not memory:
            raise HTTPException(status_code=404, detail="Memory not found")
        return memory
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e


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


@router.post("/merge", response_model=dict[str, Any])
async def merge_memories(
    data: MemoryMergeRequest,
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, Any]:
    """Merge multiple memories into one."""
    try:
        new_id = await service.merge_memories(user_id, data.memory_ids, data.new_content)
        if not new_id:
            raise HTTPException(status_code=400, detail="Failed to merge memories")
        return {"status": "ok", "id": str(new_id)}
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e


@router.get("/export")
async def export_memories(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
    format: str = Query("json", pattern="^(json|csv)$"),
) -> Response:
    """Export all memories."""
    content = await service.export_memories(user_id, format)

    media_type = "application/json" if format == "json" else "text/csv"
    filename = f"memories_export.{format}"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/on-this-day", response_model=dict[str, list[MemoryResponse]])
async def get_on_this_day(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, list[Memory]]:
    """Get memories from this day in previous years."""
    memories = await service.get_on_this_day(user_id)
    return {"memories": memories}


# --- Collections ---


@router.get("/collections", response_model=dict[str, list[MemoryCollectionResponse]])
async def list_collections(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, list[MemoryCollection]]:
    """List memory collections."""
    collections = await service.list_collections(user_id)
    return {"collections": collections}


@router.post("/collections", response_model=MemoryCollectionResponse)
async def create_collection(
    data: MemoryCollectionRequest,
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> MemoryCollection:
    """Create a new memory collection."""
    return await service.create_collection(user_id, data.name, data.description)


@router.patch("/collections/{collection_id}", response_model=MemoryCollectionResponse)
async def update_collection(
    collection_id: UUID,
    data: MemoryCollectionRequest,
    _user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> MemoryCollection:
    """Update a memory collection."""
    collection = await service.update_collection(collection_id, data.name, data.description)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: UUID,
    _user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, str]:
    """Delete a memory collection."""
    success = await service.delete_collection(collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"status": "ok"}
