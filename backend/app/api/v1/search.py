"""Unified semantic search across memories, notes, tasks, and chat messages."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.dependencies import get_memory_service
from app.core.security.auth import CurrentUser
from app.domain.memory.service import MemoryService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["search"])


class SearchResultItem(BaseModel):
    """A single hit from the unified search."""

    source: str  # "memory" | "note" | "task" | "chat"
    id: str
    title: str | None = None
    content: str
    score: float | None = None
    created_at: str | None = None
    meta: dict = {}


class UnifiedSearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
    total: int


@router.get(
    "/search",
    response_model=UnifiedSearchResponse,
    summary="Unified semantic search",
    description=(
        "Search across memories (vector), notes, tasks, and chat messages. "
        "Memories use cosine similarity; the rest use full-text ILIKE matching."
    ),
)
async def unified_search(
    user_id: CurrentUser,
    memory_service: Annotated[MemoryService, Depends(get_memory_service)],
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
) -> UnifiedSearchResponse:
    """Run a unified search and return ranked results from all sources."""
    from app.domain.productivity.models import Note, Task  # noqa: PLC0415
    from app.infrastructure.database.models.chat_models import ChatMessage  # noqa: PLC0415

    results: list[SearchResultItem] = []

    # ── 1. Vector search: memories ────────────────────────────────────────────
    try:
        memories = await memory_service.retrieve_memories(q, user_id=user_id)
        for mem in memories[:limit]:
            results.append(
                SearchResultItem(
                    source="memory",
                    id=str(mem.id),
                    content=mem.content,
                    created_at=mem.created_at.isoformat() if mem.created_at else None,
                    meta=mem.meta or {},
                )
            )
    except Exception:
        logger.warning("Memory search failed for user=%s query=%r", user_id, q)

    # ── 2. Full-text: notes ───────────────────────────────────────────────────
    try:
        notes = (
            await Note.filter(user_id=user_id, deleted_at__isnull=True)
            .filter(title__icontains=q)
            .limit(limit)
        )
        if len(notes) < limit:
            content_notes = (
                await Note.filter(user_id=user_id, deleted_at__isnull=True)
                .filter(content__icontains=q)
                .limit(limit - len(notes))
            )
            seen_ids = {n.id for n in notes}
            notes = notes + [n for n in content_notes if n.id not in seen_ids]

        for note in notes:
            results.append(
                SearchResultItem(
                    source="note",
                    id=str(note.id),
                    title=note.title,
                    content=note.content[:300],
                    created_at=note.created_at.isoformat() if note.created_at else None,
                )
            )
    except Exception:
        logger.warning("Note search failed for user=%s query=%r", user_id, q)

    # ── 3. Full-text: tasks ───────────────────────────────────────────────────
    try:
        tasks = (
            await Task.filter(user_id=user_id, deleted_at__isnull=True)
            .filter(title__icontains=q)
            .limit(limit)
        )
        for task in tasks:
            results.append(
                SearchResultItem(
                    source="task",
                    id=str(task.id),
                    title=task.title,
                    content=task.description or task.title,
                    created_at=task.created_at.isoformat() if task.created_at else None,
                    meta={"is_completed": task.is_completed},
                )
            )
    except Exception:
        logger.warning("Task search failed for user=%s query=%r", user_id, q)

    # ── 4. Full-text: chat messages ───────────────────────────────────────────
    try:
        messages = (
            await ChatMessage.filter(user_id=user_id)
            .filter(content__icontains=q)
            .order_by("-created_at")
            .limit(limit)
        )
        for msg in messages:
            results.append(
                SearchResultItem(
                    source="chat",
                    id=str(msg.id),
                    content=msg.content[:300],
                    created_at=msg.created_at.isoformat() if msg.created_at else None,
                    meta={"room_id": str(msg.room_id)},
                )
            )
    except Exception:
        logger.warning("Chat message search failed for user=%s query=%r", user_id, q)

    return UnifiedSearchResponse(query=q, results=results[:limit], total=len(results))
