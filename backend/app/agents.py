"""Agents and Chat Rooms logic for Miru."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

from pydantic import BaseModel

from app.database import get_supabase
from app.memory import retrieve_memories
from app.openrouter import stream_chat

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class AgentCreate(BaseModel):
    name: str
    personality: str


class AgentGenerate(BaseModel):
    keywords: str


class AgentGenerationResponse(BaseModel):
    name: str
    personality: str


class AgentResponse(BaseModel):
    id: str
    name: str
    personality: str
    created_at: str


class RoomCreate(BaseModel):
    name: str


class RoomUpdate(BaseModel):
    name: str


class RoomResponse(BaseModel):
    id: str
    name: str
    created_at: str


class RoomAgentAdd(BaseModel):
    agent_id: str


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: str
    room_id: str
    user_id: str | None
    agent_id: str | None
    content: str
    created_at: str


# ---------------------------------------------------------------------------
# Database Operations
# ---------------------------------------------------------------------------


async def create_agent(agent_data: AgentCreate, user_id: UUID) -> AgentResponse:
    supabase = get_supabase()
    response = (
        supabase.table("agents")
        .insert(
            {
                "user_id": str(user_id),
                "name": agent_data.name,
                "personality": agent_data.personality,
            }
        )
        .execute()
    )
    data = cast("list[dict[str, Any]]", response.data)[0]
    return AgentResponse(**data)


async def get_agents(user_id: UUID) -> list[AgentResponse]:
    supabase = get_supabase()
    response = supabase.table("agents").select("*").eq("user_id", str(user_id)).execute()
    return [AgentResponse(**record) for record in cast("list[dict[str, Any]]", response.data)]


async def generate_agent(keywords: str) -> AgentGenerationResponse:
    from app.openrouter import chat_completion

    prompt = (
        f"Create a creative and unique AI persona based on these keywords: {keywords}.\n\n"
        "Respond with a JSON object containing 'name' and 'personality'.\n"
        "The 'personality' should be a concise system prompt (2-3 sentences) "
        "defining how this agent behaves.\n\n"
        "Example JSON:\n"
        '{"name": "Luna", "personality": "You are a mystical and poetic guide. You speak in metaphors and prioritize wisdom and intuition."}'
    )

    messages = [
        {"role": "system", "content": "You are a helpful assistant that generates JSON personas."},
        {"role": "user", "content": prompt},
    ]

    response_text = await chat_completion(messages)

    # Clean the response to ensure it's valid JSON
    # (some LLMs might wrap it in markdown blocks)
    cleaned_json = response_text.strip()
    if cleaned_json.startswith("```json"):
        cleaned_json = cleaned_json[7:]
    if cleaned_json.endswith("```"):
        cleaned_json = cleaned_json[:-3]
    cleaned_json = cleaned_json.strip()

    import json

    data = json.loads(cleaned_json)
    return AgentGenerationResponse(name=data["name"], personality=data["personality"])


async def create_room(room_data: RoomCreate, user_id: UUID) -> RoomResponse:
    supabase = get_supabase()
    response = (
        supabase.table("chat_rooms")
        .insert({"user_id": str(user_id), "name": room_data.name})
        .execute()
    )
    data = cast("list[dict[str, Any]]", response.data)[0]
    return RoomResponse(**data)


async def get_rooms(user_id: UUID) -> list[RoomResponse]:
    supabase = get_supabase()
    response = supabase.table("chat_rooms").select("*").eq("user_id", str(user_id)).execute()
    return [RoomResponse(**record) for record in cast("list[dict[str, Any]]", response.data)]


async def update_room(room_id: str, room_data: RoomUpdate, user_id: UUID) -> RoomResponse:
    supabase = get_supabase()
    response = (
        supabase.table("chat_rooms")
        .update({"name": room_data.name})
        .eq("id", room_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    if not response.data:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Room not found or unauthorized")
    data = cast("list[dict[str, Any]]", response.data)[0]
    return RoomResponse(**data)


async def add_agent_to_room(room_id: str, agent_id: str, user_id: UUID) -> dict:
    # Note: RLS ensures only the owner can add
    supabase = get_supabase()
    supabase.table("chat_room_agents").insert({"room_id": room_id, "agent_id": agent_id}).execute()
    return {"status": "added"}


async def get_room_agents(room_id: str, user_id: UUID) -> list[AgentResponse]:
    supabase = get_supabase()
    response = (
        supabase.table("chat_room_agents").select("agents(*)").eq("room_id", room_id).execute()
    )
    agents_data = []
    for record in cast("list[dict[str, Any]]", response.data):
        if record.get("agents"):
            agents_data.append(AgentResponse(**record["agents"]))
    return agents_data


async def get_room_messages(room_id: str, user_id: UUID) -> list[ChatMessageResponse]:
    supabase = get_supabase()
    response = (
        supabase.table("chat_messages")
        .select("*")
        .eq("room_id", room_id)
        .order("created_at", desc=False)
        .execute()
    )
    return [ChatMessageResponse(**record) for record in cast("list[dict[str, Any]]", response.data)]


async def save_message(
    room_id: str, content: str, sender_id: str, is_agent: bool
) -> ChatMessageResponse:
    supabase = get_supabase()
    insert_data = {"room_id": room_id, "content": content}
    if is_agent:
        insert_data["agent_id"] = sender_id
    else:
        insert_data["user_id"] = sender_id

    response = supabase.table("chat_messages").insert(insert_data).execute()
    data = cast("list[dict[str, Any]]", response.data)[0]
    return ChatMessageResponse(**data)


# ---------------------------------------------------------------------------
# Chat Logic
# ---------------------------------------------------------------------------


async def stream_room_responses(
    room_id: str, user_message: str, user_id: UUID
) -> AsyncIterator[str]:
    """Process a user message in a room and generate responses from all agents."""
    # 1. Save user message
    await save_message(room_id, user_message, str(user_id), is_agent=False)

    # 2. Get previous messages for context
    messages = await get_room_messages(room_id, user_id)
    # Convert history into LLM-friendly format. We'll include the sender's name if possible,
    # but for simplicity, we'll format it as a combined conversation.

    # Need to get agent names for previous messages
    agents = await get_agents(user_id)  # Optimization: fetch only needed or pass map
    agent_map = {a.id: a.name for a in agents}

    history_text = ""
    for msg in messages:
        if msg.user_id:
            history_text += f"User: {msg.content}\n"
        elif msg.agent_id:
            agent_name = agent_map.get(msg.agent_id, "Agent")
            history_text += f"{agent_name}: {msg.content}\n"

    # 3. Get agents in the room
    room_agents = await get_room_agents(room_id, user_id)
    if not room_agents:
        yield "No agents in this room to respond."
        return

    # 4. Generate response for each agent
    memories = await retrieve_memories(user_message, user_id=user_id)
    memory_block = ""
    if memories:
        joined = "\n- ".join(memories)
        memory_block = f"\n\nRelevant things I remember about the user:\n- {joined}\n"

    for agent in room_agents:
        # We format a delimiter to help the client parse who is speaking if needed,
        # or just for readability in a simple text stream.
        # A more robust approach would use Server-Sent Events (SSE) with JSON chunks,
        # but we stick to the existing text/plain streaming format for consistency.
        yield f"[[AGENT:{agent.id}:{agent.name}]]\n"

        system_prompt = (
            f"You are {agent.name}. Your personality is: {agent.personality}\n"
            f"You are in a group chat room. Respond to the conversation naturally based on your personality."
            f"{memory_block}"
        )

        llm_messages = [
            {"role": "system", "content": system_prompt},
        ]
        if history_text:
            # Pass the recent history (last few messages) as context
            llm_messages.append(
                {
                    "role": "user",
                    "content": f"Conversation history:\n{history_text}\n\nPlease provide your response.",
                }
            )
        else:
            llm_messages.append({"role": "user", "content": user_message})

        agent_reply_chunks = []
        async for chunk in stream_chat(llm_messages):
            agent_reply_chunks.append(chunk)
            yield chunk

        yield "\n\n"

        # Save the agent's response
        full_reply = "".join(agent_reply_chunks)
        await save_message(room_id, full_reply, agent.id, is_agent=True)
