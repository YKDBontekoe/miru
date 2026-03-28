"""API endpoints for tasks."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security.auth import CurrentUser
from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.schemas import TaskCreate, TaskResponse, TaskUpdate
from app.domain.productivity.use_cases.manage_productivity import (
    ManageProductivityUseCase,
    TaskNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tasks"])

ProductivityUseCaseDep = Annotated[ManageProductivityUseCase, Depends(get_productivity_use_case)]


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=201,
    summary="Create task",
    description="Create a new task for the current user. Requires authentication.",
    responses={
        201: {"description": "Task created successfully."},
        401: {"description": "Authentication required"},
        422: {"description": "Validation Error"},
    },
)
async def create_task(
    task_data: TaskCreate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> TaskResponse:
    """Create a new task."""
    task = await use_case.create_task(user_id, task_data)
    # The TaskResponse model_validate method handles the conversion
    # from the pure TaskEntity to the Pydantic TaskResponse schema.
    return TaskResponse.model_validate(task)


@router.get(
    "/tasks",
    response_model=list[TaskResponse],
    summary="List tasks",
    description="Retrieve all tasks for the current user. Requires authentication.",
    responses={
        200: {"description": "Tasks retrieved successfully."},
        401: {"description": "Authentication required"},
    },
)
async def list_tasks(
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[TaskResponse]:
    """List all tasks for the current user."""
    tasks = await use_case.list_tasks(user_id, limit=limit, offset=offset)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get task",
    description="Retrieve a specific task by ID. Requires authentication.",
    responses={
        200: {"description": "Task retrieved successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Task not found"},
        422: {"description": "Validation Error"},
    },
)
async def get_task(
    task_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> TaskResponse:
    """Get a specific task."""
    try:
        task = await use_case.get_task(user_id, task_id)
        return TaskResponse.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "task_not_found", "message": "Task not found"},
        ) from None


@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
    description="Update a specific task by ID. Requires authentication.",
    responses={
        200: {"description": "Task updated successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Task not found"},
        422: {"description": "Validation Error"},
    },
)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> TaskResponse:
    """Update a specific task."""
    try:
        task = await use_case.update_task(user_id, task_id, task_data)
        return TaskResponse.model_validate(task)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "task_not_found", "message": "Task not found"},
        ) from None


@router.delete(
    "/tasks/{task_id}",
    status_code=204,
    summary="Delete task",
    description="Delete an existing task. Requires authentication.",
    responses={
        204: {"description": "Task deleted successfully."},
        401: {"description": "Authentication required"},
        404: {"description": "Task not found"},
        422: {"description": "Validation Error"},
    },
)
async def delete_task(
    task_id: UUID,
    user_id: CurrentUser,
    use_case: ProductivityUseCaseDep,
) -> None:
    """Delete a specific task."""
    try:
        await use_case.delete_task(user_id, task_id)
    except TaskNotFoundError:
        raise HTTPException(
            status_code=404, detail={"error": "task_not_found", "message": "Task not found"}
        ) from None
