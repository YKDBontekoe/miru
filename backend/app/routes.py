"""FastAPI routes for Miru."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any, cast

from fastapi import APIRouter, HTTPException, Query

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.crew import detect_task_type, run_crew
from app.database import get_supabase
from app.memory import retrieve_memories, store_memory
from app.openrouter import list_models, stream_chat

router = APIRouter()

SYSTEM_PROMPT = """You are Miru, a warm and thoughtful personal AI assistant.
You remember things the user has told you in the past.
When relevant memories are provided, weave them naturally into your responses.
Be concise, helpful, and human."""


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    message: str
    model: str | None = None  # OpenRouter model ID; uses default if omitted
    use_crew: bool = False  # Set True to route through CrewAI agents


class MemoryRequest(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _stream_response(message: str, model: str | None) -> AsyncIterator[str]:
    """Retrieve memories, build context, then stream an OpenRouter response."""
    memories = await retrieve_memories(message)

    memory_block = ""
    if memories:
        joined = "\n- ".join(memories)
        memory_block = f"\n\nRelevant things I remember about you:\n- {joined}\n"

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": SYSTEM_PROMPT + memory_block},
        {"role": "user", "content": message},
    ]

    async for chunk in stream_chat(messages, model=model):
        yield chunk

    asyncio.create_task(store_memory(message))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """Stream a chat response via OpenRouter, injecting relevant memories.

    Pass ``use_crew=true`` to route the message through a dynamically
    composed CrewAI crew instead of a single-turn completion.
    """
    if request.use_crew:
        # CrewAI path — returns a complete string; we stream it as a single chunk
        async def _crew_stream() -> AsyncIterator[str]:
            memories = await retrieve_memories(request.message)
            result = await run_crew(request.message, model=request.model, memories=memories)
            yield result
            asyncio.create_task(store_memory(request.message))

        return StreamingResponse(
            _crew_stream(),
            media_type="text/plain; charset=utf-8",
        )

    return StreamingResponse(
        _stream_response(request.message, model=request.model),
        media_type="text/plain; charset=utf-8",
    )


@router.post("/crew")
async def crew_run(request: ChatRequest) -> dict:
    """Run a CrewAI crew for the given message and return the full result.

    Unlike ``/chat``, this endpoint waits for the entire crew to finish and
    returns a JSON body with the output and detected task type.
    """
    memories = await retrieve_memories(request.message)
    task_type = detect_task_type(request.message)

    result = await run_crew(request.message, model=request.model, memories=memories)
    asyncio.create_task(store_memory(request.message))

    return {
        "task_type": task_type,
        "model": request.model,
        "result": result,
    }


@router.get("/models")
async def get_models(
    search: str | None = Query(default=None, description="Filter models by name or ID"),
) -> dict:
    """Return the list of models available on OpenRouter.

    An optional ``search`` query parameter filters results by model ID or name.
    """
    try:
        models = await list_models()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch models: {exc}") from exc

    if search:
        search_term = search.lower()
        models = [
            model
            for model in models
            if search_term in model["id"].lower() or search_term in model["name"].lower()
        ]

    return {"models": models, "count": len(models)}


@router.post("/memories")
async def add_memory(request: MemoryRequest) -> dict:
    """Manually store a memory."""
    await store_memory(request.message)
    return {"status": "stored"}


@router.get("/memories")
async def list_memories() -> dict:
    """Return all stored memories (for debugging)."""
    supabase = get_supabase()
    response = (
        supabase.table("memories")
        .select("id, content, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return {
        "memories": [
            {
                "id": cast("str", record["id"]),
                "content": cast("str", record["content"]),
                "created_at": cast("str", record["created_at"]),
            }
            for record in cast("list[dict[str, Any]]", response.data)
        ]
    }
