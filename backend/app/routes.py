"""FastAPI routes for Miru."""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.memory import get_mistral_client, retrieve_memories, store_memory
from app.config import settings

router = APIRouter()

CHAT_MODEL = "mistral-large-latest"

SYSTEM_PROMPT = """You are Miru, a warm and thoughtful personal AI assistant.
You remember things the user has told you in the past.
When relevant memories are provided, weave them naturally into your responses.
Be concise, helpful, and human."""


class ChatRequest(BaseModel):
    message: str


async def _stream_response(message: str) -> None:
    """Generator that streams the Mistral response and stores the memory."""
    # 1. Retrieve relevant memories
    memories = await retrieve_memories(message)

    # 2. Build context block
    memory_block = ""
    if memories:
        joined = "\n- ".join(memories)
        memory_block = f"\n\nRelevant things I remember about you:\n- {joined}\n"

    # 3. Stream from Mistral
    client = get_mistral_client()
    full_reply: list[str] = []

    with client.chat.stream(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + memory_block},
            {"role": "user", "content": message},
        ],
    ) as stream:
        for chunk in stream:
            delta = chunk.data.choices[0].delta.content if chunk.data.choices else None
            if delta:
                full_reply.append(delta)
                yield delta

    # 4. Store the user message as a memory after streaming completes
    asyncio.create_task(store_memory(message))


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    """Stream a chat response, injecting relevant memories into context."""
    return StreamingResponse(
        _stream_response(req.message),
        media_type="text/plain; charset=utf-8",
    )


@router.post("/memories")
async def add_memory(req: ChatRequest) -> dict:
    """Manually store a memory."""
    await store_memory(req.message)
    return {"status": "stored"}


@router.get("/memories")
async def list_memories() -> dict:
    """Return all stored memories (for debugging)."""
    from app.database import get_pool

    pool = await get_pool()
    rows = await pool.fetch("SELECT id, content, created_at FROM memories ORDER BY created_at DESC")
    return {
        "memories": [
            {"id": r["id"], "content": r["content"], "created_at": r["created_at"].isoformat()}
            for r in rows
        ]
    }
