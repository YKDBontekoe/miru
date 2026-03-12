"""Chat service for business logic and orchestration."""

from __future__ import annotations

import asyncio
import random
from typing import TYPE_CHECKING, Any, AsyncIterator
from uuid import UUID

from app.domain.chat.models import (
    ChatMessageResponse,
    ChatRequest,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from app.infrastructure.repositories.chat_repo import ChatRepository
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.infrastructure.repositories.memory_repo import MemoryRepository
from app.infrastructure.external.openrouter import chat_completion, get_openrouter_client
from app.core.config import get_settings

if TYPE_CHECKING:
    from app.domain.agents.models import AgentResponse

class ChatService:
    def __init__(
        self, 
        chat_repo: ChatRepository, 
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository
    ):
        self.chat_repo = chat_repo
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo

    async def create_room(self, name: str, user_id: UUID) -> RoomResponse:
        return await self.chat_repo.create_room(name, user_id)

    async def list_rooms(self, user_id: UUID) -> list[RoomResponse]:
        return await self.chat_repo.list_rooms(user_id)

    async def get_room_agents(self, room_id: str) -> list[AgentResponse]:
        raw_agents = await self.chat_repo.get_room_agents_raw(room_id)
        return [self.agent_repo._agent_from_row(a) for a in raw_agents]

    async def orchestrate_turn(self, history_text: str, room_agents: list[AgentResponse]) -> list[str]:
        """Decide which agent(s) should speak next."""
        agents_info = "\n".join([f"- {a.name} (ID: {a.id}): {a.personality}" for a in room_agents])
        
        # In a real refactor, get_agent_relationships would also move to AgentService/Repo
        relationship_block = "" 

        system_prompt = (
            "You are an Orchestrator managing a chat room with multiple AI personas and a User.\n"
            "Your job is to read the conversation history and decide who should speak next.\n\n"
            f"Available Agents:\n{agents_info}\n{relationship_block}\n"
            "Rules:\n"
            "1. If the User's query is answered and concluded, return `[]`.\n"
            "2. Respond ONLY with a valid JSON array of Agent IDs (strings)."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Conversation history:\n{history_text}\n\nWho should speak next?"},
        ]

        try:
            response_text = await chat_completion(messages)
            # JSON parsing logic here (omitted for brevity, matches agents.py)
            import json
            import re
            cleaned = response_text.strip()
            if cleaned.startswith("```json"): cleaned = cleaned[7:]
            if cleaned.endswith("```"): cleaned = cleaned[:-3]
            return [str(aid) for aid in json.loads(cleaned.strip())]
        except Exception:
            return [room_agents[0].id] if room_agents else []

    async def stream_room_responses(
        self, room_id: str, user_message: str, user_id: UUID
    ) -> AsyncIterator[str]:
        """The core agentic chat loop."""
        await self.chat_repo.save_message(room_id, user_message, str(user_id), is_agent=False)
        
        # 1. Fetch Context
        room_agents = await self.get_room_agents(room_id)
        if not room_agents:
            yield "No agents in this room."
            return

        # 2. Start Turn Loop
        # (Detailed logic from agents.py stream_room_responses would go here, 
        # using self.memory_repo and self.chat_repo)
        yield f"[[STATUS:glance:Sensing the room...]]\n"
        # ... implementation continues
        yield "[[STATUS:done]]\n"
