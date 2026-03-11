"""FastAPI routes for Miru."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any, cast

from fastapi import APIRouter, HTTPException, status

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents import (
    AgentCreate,
    AgentGenerate,
    AgentGenerationResponse,
    AgentResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    RoomAgentAdd,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
    add_agent_to_room,
    create_agent,
    create_room,
    generate_agent,
    get_agents,
    get_room_agents,
    get_room_messages,
    get_rooms,
    stream_room_responses,
    update_room,
)
from app.auth import CurrentUser  # noqa: TC001
from app.crew import detect_task_type, run_crew
from app.database import get_supabase
from app.graph import get_memory_relationships
from app.memory import retrieve_memories, store_memory
from app.openrouter import stream_chat
from app.passkey import (
    generate_authentication_options,
    generate_registration_options,
    store_passkey,
    verify_authentication,
    verify_registration,
)

logger = logging.getLogger(__name__)

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
    use_crew: bool = False  # Set True to route through CrewAI agents


class MemoryRequest(BaseModel):
    message: str


class PasskeyRegisterOptionsRequest(BaseModel):
    device_name: str | None = None


class PasskeyRegisterVerifyRequest(BaseModel):
    challenge_id: str
    credential: str  # JSON-encoded PublicKeyCredential
    device_name: str | None = None


class PasskeyLoginOptionsRequest(BaseModel):
    email: str


class PasskeyLoginVerifyRequest(BaseModel):
    challenge_id: str
    credential: str  # JSON-encoded PublicKeyCredential (assertion)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _stream_response(message: str, user_id: UUID) -> AsyncIterator[str]:
    """Retrieve memories, build context, stream a response, then store memory.

    The full assistant reply is accumulated while streaming so that both the
    user message and the complete response can be passed to ``store_memory``.
    The memory extraction task is fired after the last chunk is yielded.
    """
    yield "[[STATUS:retrieving_memories]]\n"
    memories = await retrieve_memories(message, user_id=user_id)

    memory_block = ""
    if memories:
        joined = "\n- ".join(memories)
        memory_block = f"\n\nRelevant things I remember about you:\n- {joined}\n"

    yield "[[STATUS:thinking]]\n"

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": SYSTEM_PROMPT + memory_block},
        {"role": "user", "content": message},
    ]

    reply_chunks: list[str] = []
    async for chunk in stream_chat(messages):
        reply_chunks.append(chunk)
        yield chunk

    # Fire memory extraction in the background after streaming completes.
    full_reply = "".join(reply_chunks)
    asyncio.create_task(store_memory(message, full_reply, user_id=user_id))


# ---------------------------------------------------------------------------
# Chat routes (authenticated)
# ---------------------------------------------------------------------------


@router.post("/chat")
async def chat(request: ChatRequest, user_id: CurrentUser) -> StreamingResponse:
    """Stream a chat response via OpenRouter, injecting relevant memories."""
    if request.use_crew:

        async def _crew_stream() -> AsyncIterator[str]:
            memories = await retrieve_memories(request.message, user_id=user_id)
            result = await run_crew(request.message, memories=memories)
            yield result
            asyncio.create_task(store_memory(request.message, result, user_id=user_id))

        return StreamingResponse(
            _crew_stream(),
            media_type="text/plain; charset=utf-8",
        )

    return StreamingResponse(
        _stream_response(request.message, user_id=user_id),
        media_type="text/plain; charset=utf-8",
    )


@router.post("/crew")
async def crew_run(request: ChatRequest, user_id: CurrentUser) -> dict:
    """Run a CrewAI crew and return the full structured result."""
    memories = await retrieve_memories(request.message, user_id=user_id)
    task_type = detect_task_type(request.message)

    result = await run_crew(request.message, memories=memories)
    asyncio.create_task(store_memory(request.message, result, user_id=user_id))

    return {
        "task_type": task_type,
        "result": result,
    }


@router.post("/memories")
async def add_memory(request: MemoryRequest, user_id: CurrentUser) -> dict:
    """Manually store a memory (uses empty assistant reply)."""
    await store_memory(request.message, "", user_id=user_id)
    return {"status": "stored"}


@router.get("/memories")
async def list_memories(user_id: CurrentUser) -> dict:
    """Return memories for the authenticated user."""
    supabase = get_supabase()
    response = (
        supabase.table("memories")
        .select("id, content, created_at")
        .eq("user_id", str(user_id))
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


@router.get("/memories/graph")
async def list_memory_graph(user_id: CurrentUser) -> dict:
    """Return user memories as graph nodes and edges."""
    supabase = get_supabase()
    response = (
        supabase.table("memories")
        .select("id, content, created_at")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .execute()
    )

    memory_rows = cast("list[dict[str, Any]]", response.data)
    nodes = [
        {
            "id": cast("str", record["id"]),
            "content": cast("str", record["content"]),
            "created_at": cast("str", record["created_at"]),
        }
        for record in memory_rows
    ]

    memory_ids = [cast("str", record["id"]) for record in memory_rows]
    edges: list[dict[str, str]] = []

    try:
        edges = await get_memory_relationships(memory_ids)
    except Exception:
        logger.exception("Failed to load memory graph relationships for user %s", user_id)

    return {
        "nodes": nodes,
        "edges": edges,
    }


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, user_id: CurrentUser) -> dict:
    """Delete a memory by ID (must belong to the authenticated user)."""
    supabase = get_supabase()
    # Verify ownership before deleting.
    rows = (
        supabase.table("memories")
        .select("id")
        .eq("id", memory_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    if not cast("list[dict[str, Any]]", rows.data):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found",
        )
    supabase.table("memories").delete().eq("id", memory_id).execute()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Passkey routes
# ---------------------------------------------------------------------------

passkey_router = APIRouter(prefix="/auth/passkey", tags=["auth"])


@passkey_router.post("/register/options")
async def passkey_register_options(
    request: PasskeyRegisterOptionsRequest,
    user_id: CurrentUser,
) -> dict:
    """Generate WebAuthn registration options for an authenticated user.

    The client should pass the returned ``options`` to
    ``navigator.credentials.create()`` (web) or the equivalent native API,
    then send the resulting credential to ``/register/verify`` along with the
    returned ``challenge_id``.
    """
    supabase = get_supabase()
    # Fetch existing credentials to exclude from registration.
    rows = supabase.table("passkeys").select("credential_id").eq("user_id", str(user_id)).execute()
    existing_rows = cast("list[dict[str, Any]]", rows.data)

    from app.passkey import _decode_credential_id  # local import to avoid circular

    existing_ids = [_decode_credential_id(r["credential_id"]) for r in existing_rows]

    # Fetch user email from Supabase auth.
    user_email = _get_user_email_from_jwt(user_id)

    result = generate_registration_options(
        user_id=user_id,
        user_email=user_email,
        existing_credential_ids=existing_ids,
    )
    return result


@passkey_router.post("/register/verify")
async def passkey_register_verify(
    request: PasskeyRegisterVerifyRequest,
    user_id: CurrentUser,
) -> dict:
    """Verify a WebAuthn registration response and persist the new passkey."""
    try:
        passkey_data = verify_registration(
            challenge_id=request.challenge_id,
            credential_json=request.credential,
            device_name=request.device_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Ensure the verified passkey belongs to the authenticated user.
    if passkey_data["user_id"] != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User mismatch in passkey registration",
        )

    row = store_passkey(passkey_data)
    return {
        "id": row["id"],
        "device_name": row.get("device_name"),
        "created_at": row.get("created_at"),
    }


@passkey_router.post("/login/options")
async def passkey_login_options(request: PasskeyLoginOptionsRequest) -> dict:
    """Generate WebAuthn authentication options (unauthenticated endpoint).

    The client passes the user's email address. The backend looks up their
    registered passkeys and returns the assertion options.
    """
    try:
        result = generate_authentication_options(user_email=request.email)
    except ValueError as exc:
        # Don't leak whether the user/passkeys exist — return 400 generically.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No passkeys registered for this account",
        ) from exc
    return result


@passkey_router.post("/login/verify")
async def passkey_login_verify(request: PasskeyLoginVerifyRequest) -> dict:
    """Verify a WebAuthn assertion and return a Supabase session (unauthenticated).

    On success, returns ``access_token``, ``refresh_token``, ``expires_in``,
    and ``user`` — the same shape as a Supabase auth response so the Flutter
    client can use the standard ``supabase_flutter`` session management.
    """
    try:
        session = verify_authentication(
            challenge_id=request.challenge_id,
            credential_json=request.credential,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    return session


@passkey_router.get("/list")
async def passkey_list(user_id: CurrentUser) -> dict:
    """List all registered passkeys for the authenticated user."""
    supabase = get_supabase()
    rows = (
        supabase.table("passkeys")
        .select("id, device_name, transports, created_at, last_used_at")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .execute()
    )
    return {"passkeys": cast("list[dict[str, Any]]", rows.data)}


@passkey_router.delete("/{passkey_id}")
async def passkey_delete(passkey_id: str, user_id: CurrentUser) -> dict:
    """Delete a passkey credential by ID (must belong to the authenticated user)."""
    supabase = get_supabase()
    # Verify ownership before deleting.
    rows = (
        supabase.table("passkeys")
        .select("id")
        .eq("id", passkey_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    if not cast("list[dict[str, Any]]", rows.data):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passkey not found",
        )
    supabase.table("passkeys").delete().eq("id", passkey_id).execute()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_user_email_from_jwt(user_id: UUID) -> str:
    """Fetch the email for a user from the Supabase admin API.

    We cache nothing here — this is called infrequently (only on passkey
    registration) so a direct admin lookup is acceptable.
    """
    from app.passkey import _get_admin_client

    admin = _get_admin_client()
    user = admin.auth.admin.get_user_by_id(str(user_id))
    if not user or not user.user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return str(user.user.email)


# ---------------------------------------------------------------------------
# Agents and Rooms Routes
# ---------------------------------------------------------------------------


@router.post("/agents", response_model=AgentResponse)
async def create_agent_route(request: AgentCreate, user_id: CurrentUser) -> Any:
    """Create a new agent."""
    return await create_agent(request, user_id)


@router.get("/agents", response_model=list[AgentResponse])
async def list_agents_route(user_id: CurrentUser) -> Any:
    """List all agents for the authenticated user."""
    return await get_agents(user_id)


@router.post("/agents/generate", response_model=AgentGenerationResponse)
async def generate_agent_route(request: AgentGenerate, user_id: CurrentUser) -> Any:
    """Generate an agent from keywords."""
    return await generate_agent(request.keywords)


@router.post("/rooms", response_model=RoomResponse)
async def create_room_route(request: RoomCreate, user_id: CurrentUser) -> Any:
    """Create a new chat room."""
    return await create_room(request, user_id)


@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms_route(user_id: CurrentUser) -> Any:
    """List all chat rooms for the authenticated user."""
    return await get_rooms(user_id)


@router.patch("/rooms/{room_id}", response_model=RoomResponse)
async def update_room_route(room_id: str, request: RoomUpdate, user_id: CurrentUser) -> Any:
    """Update a chat room's details."""
    return await update_room(room_id, request, user_id)


@router.post("/rooms/{room_id}/agents")
async def add_agent_to_room_route(room_id: str, request: RoomAgentAdd, user_id: CurrentUser) -> Any:
    """Add an agent to a chat room."""
    return await add_agent_to_room(room_id, request.agent_id, user_id)


@router.get("/rooms/{room_id}/agents", response_model=list[AgentResponse])
async def get_room_agents_route(room_id: str, user_id: CurrentUser) -> Any:
    """List all agents in a chat room."""
    return await get_room_agents(room_id, user_id)


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageResponse])
async def list_room_messages_route(room_id: str, user_id: CurrentUser) -> Any:
    """List all messages in a chat room."""
    return await get_room_messages(room_id, user_id)


@router.post("/rooms/{room_id}/chat")
async def room_chat_route(
    room_id: str, request: ChatMessageCreate, user_id: CurrentUser
) -> StreamingResponse:
    """Send a message to a chat room and stream responses from all agents."""
    return StreamingResponse(
        stream_room_responses(room_id, request.content, user_id),
        media_type="text/plain; charset=utf-8",
    )
