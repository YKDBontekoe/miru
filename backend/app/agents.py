"""Agents and Chat Rooms logic for Miru."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

from pydantic import BaseModel

from app.database import get_supabase
from app.memory import retrieve_memories, store_memory
from app.openrouter import chat_completion, stream_chat

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

    cleaned_json = response_text.strip()
    if cleaned_json.startswith("```json"):
        cleaned_json = cleaned_json[7:]
    if cleaned_json.endswith("```"):
        cleaned_json = cleaned_json[:-3]
    cleaned_json = cleaned_json.strip()

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
# Orchestrator Logic
# ---------------------------------------------------------------------------


async def orchestrate_turn(history_text: str, room_agents: list[AgentResponse]) -> list[str]:
    """Ask an LLM to decide which agent(s) should speak next.

    Returns a list of agent IDs. Returns an empty list if it decides the agents
    should stop and wait for the user.
    """
    agents_info = "\n".join([f"- {a.name} (ID: {a.id}): {a.personality}" for a in room_agents])

    system_prompt = (
        "You are an Orchestrator managing a chat room with multiple AI personas and a User.\n"
        "Your job is to read the conversation history and decide who should speak next.\n\n"
        f"Available Agents:\n{agents_info}\n\n"
        "Rules:\n"
        "1. If the User's query is answered and the conversation has naturally concluded for this turn, return an empty list `[]` to wait for the User.\n"
        "2. If an Agent is directly addressed or uniquely qualified to answer, return their ID.\n"
        "3. If multiple agents should collaborate, you can return multiple IDs (they will speak sequentially).\n"
        "4. If an Agent just spoke and another Agent might want to add value, agree, or disagree based on their personality, return their ID.\n"
        '5. Respond ONLY with a valid JSON array of Agent IDs (strings). E.g. `["id1"]` or `["id1", "id2"]` or `[]`.'
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"Conversation history:\n{history_text}\n\nWho should speak next?",
        },
    ]

    try:
        response_text = await chat_completion(messages)
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        selected_ids = json.loads(cleaned.strip())
        if not isinstance(selected_ids, list):
            logger.error(f"Orchestrator returned non-list: {selected_ids}")
            return []
        return [str(aid) for aid in selected_ids]
    except Exception as e:
        logger.error(f"Orchestrator failed: {e}")
        # Fallback: if orchestrator fails, let the first available agent speak, then stop.
        if room_agents:
            return [room_agents[0].id]
        return []


# ---------------------------------------------------------------------------
# Chat Logic
# ---------------------------------------------------------------------------


async def stream_room_responses(
    room_id: str, user_message: str, user_id: UUID
) -> AsyncIterator[str]:
    """Process a user message in a room and generate agentic responses."""
    await save_message(room_id, user_message, str(user_id), is_agent=False)

    messages = await get_room_messages(room_id, user_id)
    agents = await get_agents(user_id)
    agent_map = {a.id: a for a in agents}
    room_agents = await get_room_agents(room_id, user_id)

    if not room_agents:
        yield "No agents in this room to respond."
        return

    # Keep a running string of the history to pass to the orchestrator/agents
    history_lines = []
    for msg in messages:
        if msg.user_id:
            history_lines.append(f"User: {msg.content}")
        elif msg.agent_id:
            agent_name = agent_map[msg.agent_id].name if msg.agent_id in agent_map else "Agent"
            history_lines.append(f"{agent_name}: {msg.content}")

    # Memory context
    user_memories = await retrieve_memories(user_message, user_id=user_id)
    user_memory_block = ""
    if user_memories:
        joined = "\n- ".join(user_memories)
        user_memory_block = f"\n\nRelevant things I remember about the user:\n- {joined}\n"

    room_memories = await retrieve_memories(user_message, room_id=room_id)
    room_memory_block = ""
    if room_memories:
        joined = "\n- ".join(room_memories)
        room_memory_block = f"\n\nContext and past decisions from this room:\n- {joined}\n"

    turn_count = 0
    max_turns = 5  # Prevent infinite loops

    while turn_count < max_turns:
        history_text = "\n".join(
            history_lines[-10:]
        )  # Pass only recent history to keep context size manageable
        next_speakers = await orchestrate_turn(history_text, room_agents)

        if not next_speakers:
            break  # Orchestrator decided we are done for this turn

        for agent_id in next_speakers:
            if agent_id not in agent_map:
                continue

            agent = agent_map[agent_id]

            # Fetch persona memories specific to this agent
            agent_memories = await retrieve_memories(user_message, agent_id=agent.id)
            agent_memory_block = ""
            if agent_memories:
                joined = "\n- ".join(agent_memories)
                agent_memory_block = f"\n\nYour past experiences/skills:\n- {joined}\n"

            yield f"[[AGENT:{agent.id}:{agent.name}]]\n"

            system_prompt = (
                f"You are {agent.name}. Your personality is: {agent.personality}\n"
                f"You are in a group chat room. Respond naturally based on your personality "
                f"and the conversation context.{user_memory_block}{room_memory_block}{agent_memory_block}"
            )

            llm_messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Conversation history:\n{history_text}\n\nIt is your turn to speak. Please provide your response.",
                },
            ]

            agent_reply_chunks = []
            async for chunk in stream_chat(llm_messages):
                agent_reply_chunks.append(chunk)
                yield chunk

            yield "\n\n"

            full_reply = "".join(agent_reply_chunks)
            await save_message(room_id, full_reply, agent.id, is_agent=True)

            # Update history for the next iteration / orchestrator check
            history_lines.append(f"{agent.name}: {full_reply}")

            # Extract memories asynchronously
            asyncio.create_task(
                store_memory(
                    user_message=history_text, assistant_reply=full_reply, agent_id=agent.id
                )
            )
            asyncio.create_task(
                store_memory(user_message=history_text, assistant_reply=full_reply, room_id=room_id)
            )

        turn_count += 1
