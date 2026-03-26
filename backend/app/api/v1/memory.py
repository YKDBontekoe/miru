"""Memory API router v1."""

from __future__ import annotations

import io
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openai import APIConnectionError

from app.api.dependencies import get_memory_service
from app.core.security.auth import CurrentUser  # noqa: TCH001
from app.domain.memory.models import Memory, MemoryRequest, MemoryResponse  # noqa: TCH001
from app.domain.memory.service import MemoryService  # noqa: TCH001

router = APIRouter(tags=["Memory"])


@router.get(
    "",
    response_model=dict[str, list[MemoryResponse]],
    summary="List memories",
    description="Retrieve top memories for the current user. Requires authentication.",
    responses={
        200: {"description": "List of memories retrieved successfully."},
        401: {"description": "Authentication required"},
        503: {"description": "Upstream AI service is currently unreachable"},
    },
)
async def list_memories(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
) -> dict[str, list[Memory]]:
    """Retrieve top memories for the current user."""
    try:
        memories = await service.retrieve_memories(query="", user_id=user_id)
        return {"memories": memories}
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e


@router.get(
    "/graph",
    response_model=dict[str, Any],
    summary="Get memory graph",
    description="Fetch the memory graph for the current user. Requires authentication.",
    responses={
        200: {"description": "Memory graph retrieved successfully."},
        401: {"description": "Authentication required"},
        503: {"description": "Upstream AI service is currently unreachable"},
    },
)
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


@router.post(
    "",
    response_model=dict[str, Any],
    summary="Store a memory",
    description="Manually store a new memory for the current user. Requires authentication.",
    responses={
        200: {"description": "Memory stored successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
        503: {"description": "Upstream AI service is currently unreachable"},
    },
)
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
            status_code=503,
            detail="Upstream AI service is currently unreachable",
        ) from e


@router.post(
    "/upload",
    response_model=dict[str, Any],
    summary="Upload a document to extract memories",
    description="Upload a document to extract text and store in memories. Requires authentication.",
    responses={
        200: {"description": "Document processed and stored successfully."},
        401: {"description": "Authentication required"},
        413: {"description": "File too large. Maximum allowed size is 10MB."},
        415: {"description": "Unsupported file type"},
        422: {"description": "Validation Error"},
        500: {"description": "Failed to process document"},
        503: {"description": "Upstream AI service is currently unreachable"},
    },
)
async def upload_document(
    user_id: CurrentUser,
    service: Annotated[MemoryService, Depends(get_memory_service)],
    file: UploadFile = File(...),
) -> dict[str, Any]:
    """Upload a document to extract text and store in memories."""
    # 1. Validate content type
    allowed_types = {
        "text/plain",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    }
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {content_type}. Must be text, PDF, DOCX, or Image.",
        )

    # 2. Validate max size (e.g. 10MB limit)
    max_file_size = 10 * 1024 * 1024  # 10 MB
    content = b""
    while chunk := await file.read(1024 * 1024):
        content += chunk
        if len(content) > max_file_size:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum allowed size is 10MB.",
            )

    try:
        file_obj = io.BytesIO(content)

        memory_ids = await service.store_document_memory(
            file=file_obj,
            filename=file.filename or "unknown",
            content_type=content_type,
            user_id=user_id,
        )
        return {
            "status": "ok",
            "message": f"Document processed and stored in {len(memory_ids)} chunks.",
            "memory_ids": [str(m) for m in memory_ids],
        }
    except (APIConnectionError, OSError) as e:
        raise HTTPException(
            status_code=503, detail="Upstream AI service is currently unreachable"
        ) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}") from e


@router.delete(
    "/{memory_id}",
    summary="Delete a memory",
    description="Delete a memory by ID. Requires authentication.",
    responses={
        200: {"description": "Memory deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Memory not found"},
        422: {"description": "Validation Error"},
    },
)
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
