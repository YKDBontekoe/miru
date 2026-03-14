"""Service layer for productivity domain (Tasks and Notes)."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException
from tortoise.exceptions import DBConnectionError, IntegrityError, OperationalError

from app.domain.productivity.models import (
    Note,
    NoteCreate,
    NoteUpdate,
    Task,
    TaskCreate,
    TaskUpdate,
)

logger = logging.getLogger(__name__)


class ProductivityService:
    """Service for managing productivity features."""

    # ---------------------------------------------------------------------------
    # Tasks
    # ---------------------------------------------------------------------------

    @staticmethod
    async def create_task(user_id: UUID, task_data: TaskCreate) -> Task:
        """Create a new task for the user."""
        try:
            return await Task.create(
                user_id=user_id,
                title=task_data.title,
                description=task_data.description,
                is_completed=task_data.is_completed,
            )
        except (IntegrityError, OperationalError, DBConnectionError, ValueError) as e:
            logger.exception("Failed to create task")
            raise HTTPException(
                status_code=500, detail="Database error occurred while creating task"
            ) from e
        except Exception as e:
            logger.exception("Unexpected error in create_task")
            raise HTTPException(status_code=500, detail="Failed to create task") from e

    @staticmethod
    async def list_tasks(user_id: UUID, limit: int = 50, offset: int = 0) -> list[Task]:
        """List tasks for the user with pagination."""
        try:
            return (
                await Task.filter(user_id=user_id)
                .order_by("-created_at")
                .limit(limit)
                .offset(offset)
            )
        except (IntegrityError, OperationalError, DBConnectionError) as e:
            logger.exception("Failed to list tasks")
            raise HTTPException(
                status_code=500, detail="Database error occurred while listing tasks"
            ) from e
        except Exception as e:
            logger.exception("Unexpected error in list_tasks")
            raise HTTPException(status_code=500, detail="Failed to list tasks") from e

    @staticmethod
    async def get_task(user_id: UUID, task_id: UUID) -> Task:
        """Get a specific task."""
        task = await Task.get_or_none(id=task_id, user_id=user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @staticmethod
    async def update_task(user_id: UUID, task_id: UUID, update_data: TaskUpdate) -> Task:
        """Update a specific task."""
        task = await ProductivityService.get_task(user_id, task_id)

        update_fields = update_data.model_dump(exclude_unset=True)
        if not update_fields:
            return task

        # Filter out None values for non-nullable fields
        valid_keys = {}
        for k, v in update_fields.items():
            if v is None and k in ("title", "is_completed"):
                continue
            valid_keys[k] = v

        if not valid_keys:
            return task

        try:
            for field, value in valid_keys.items():
                setattr(task, field, value)
            await task.save(update_fields=list(valid_keys.keys()))
            return task
        except (IntegrityError, OperationalError, DBConnectionError, ValueError) as e:
            logger.exception("Failed to update task")
            raise HTTPException(
                status_code=500, detail="Database error occurred while updating task"
            ) from e
        except Exception as e:
            logger.exception(
                "Unexpected error in update_task for user_id=%s task_id=%s", user_id, task_id
            )
            raise HTTPException(status_code=500, detail="Failed to update task") from e

    @staticmethod
    async def delete_task(user_id: UUID, task_id: UUID) -> None:
        """Delete a specific task."""
        task = await ProductivityService.get_task(user_id, task_id)
        try:
            await task.delete()
        except (IntegrityError, OperationalError, DBConnectionError) as e:
            logger.exception("Failed to delete task")
            raise HTTPException(
                status_code=500, detail="Database error occurred while deleting task"
            ) from e
        except Exception as e:
            logger.exception(
                "Unexpected error in delete_task for user_id=%s task_id=%s", user_id, task_id
            )
            raise HTTPException(status_code=500, detail="Failed to delete task") from e

    # ---------------------------------------------------------------------------
    # Notes
    # ---------------------------------------------------------------------------

    @staticmethod
    async def create_note(user_id: UUID, note_data: NoteCreate) -> Note:
        """Create a new note for the user."""
        try:
            return await Note.create(
                user_id=user_id,
                title=note_data.title,
                content=note_data.content,
                is_pinned=note_data.is_pinned,
            )
        except (IntegrityError, OperationalError, DBConnectionError, ValueError) as e:
            logger.exception("Failed to create note")
            raise HTTPException(
                status_code=500, detail="Database error occurred while creating note"
            ) from e
        except Exception as e:
            logger.exception("Unexpected error in create_note")
            raise HTTPException(status_code=500, detail="Failed to create note") from e

    @staticmethod
    async def list_notes(user_id: UUID, limit: int = 50, offset: int = 0) -> list[Note]:
        """List notes for the user, pinned first, then by creation date."""
        try:
            return (
                await Note.filter(user_id=user_id)
                .order_by("-is_pinned", "-created_at")
                .limit(limit)
                .offset(offset)
            )
        except (IntegrityError, OperationalError, DBConnectionError) as e:
            logger.exception("Failed to list notes")
            raise HTTPException(
                status_code=500, detail="Database error occurred while listing notes"
            ) from e
        except Exception as e:
            logger.exception("Unexpected error in list_notes")
            raise HTTPException(status_code=500, detail="Failed to list notes") from e

    @staticmethod
    async def get_note(user_id: UUID, note_id: UUID) -> Note:
        """Get a specific note."""
        note = await Note.get_or_none(id=note_id, user_id=user_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return note

    @staticmethod
    async def update_note(user_id: UUID, note_id: UUID, update_data: NoteUpdate) -> Note:
        """Update a specific note."""
        note = await ProductivityService.get_note(user_id, note_id)

        update_fields = update_data.model_dump(exclude_unset=True)
        if not update_fields:
            return note

        # Filter out None values for non-nullable fields
        valid_keys = {}
        for k, v in update_fields.items():
            if v is None and k in ("title", "content", "is_pinned"):
                continue
            valid_keys[k] = v

        if not valid_keys:
            return note

        try:
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            return note
        except (IntegrityError, OperationalError, DBConnectionError, ValueError) as e:
            logger.exception("Failed to update note")
            raise HTTPException(
                status_code=500, detail="Database error occurred while updating note"
            ) from e
        except Exception as e:
            logger.exception(
                "Unexpected error in update_note for user_id=%s note_id=%s", user_id, note_id
            )
            raise HTTPException(status_code=500, detail="Failed to update note") from e

    @staticmethod
    async def delete_note(user_id: UUID, note_id: UUID) -> None:
        """Delete a specific note."""
        note = await ProductivityService.get_note(user_id, note_id)
        try:
            await note.delete()
        except (IntegrityError, OperationalError, DBConnectionError) as e:
            logger.exception("Failed to delete note")
            raise HTTPException(
                status_code=500, detail="Database error occurred while deleting note"
            ) from e
        except Exception as e:
            logger.exception(
                "Unexpected error in delete_note for user_id=%s note_id=%s", user_id, note_id
            )
            raise HTTPException(status_code=500, detail="Failed to delete note") from e
