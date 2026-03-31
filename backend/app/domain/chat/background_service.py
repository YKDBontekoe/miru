"""Background service for chat operations to enforce SRP."""

from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

if TYPE_CHECKING:
    from uuid import UUID

    from app.domain.agents.models import Agent
    from app.domain.agents.service import AgentService
    from app.infrastructure.repositories.agent_repo import AgentRepository
    from app.infrastructure.repositories.memory_repo import MemoryRepository

logger = logging.getLogger(__name__)


class RoomSummaryResponse(BaseModel):
    """Structured response model for room summaries."""

    summary: str


class ChatBackgroundService:
    """Service to handle background tasks spawned by chat interactions."""

    def __init__(
        self,
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository,
        agent_service: AgentService,
        chat_repo: Any,
    ):
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo
        self.agent_service = agent_service
        self.chat_repo = chat_repo

    async def update_mood_background(self, agent_id: UUID, recent_context: str) -> None:
        """Infer and persist an agent's mood from the recent conversation turn."""
        try:
            await self.agent_service.update_mood(agent_id, recent_context)
        except Exception:
            logger.warning("Background mood update failed for agent %s", agent_id, exc_info=True)

    async def update_affinity_background(self, user_id: UUID, agent_id: UUID) -> None:
        """Increment the user ↔ agent affinity score after a conversation turn."""
        try:
            await self.agent_repo.upsert_affinity(user_id, agent_id)
        except Exception:
            logger.warning(
                "Background affinity update failed for user=%s agent=%s",
                user_id,
                agent_id,
                exc_info=True,
            )

    async def store_memories_background(
        self,
        user_id: UUID,
        room_id: UUID,
        user_message: str,
        responded_agents: list[Agent],
        result_text: str,
        agent_names: list[str],
    ) -> None:
        """Embed and store the conversation turn as memories for future retrieval."""
        from app.domain.chat.websocket_broadcaster import ChatWebSocketBroadcaster
        from app.domain.memory.models import Memory
        from app.infrastructure.external.openrouter import embed

        try:
            # Store user message
            user_vector = await embed(user_message)
            await self.memory_repo.insert_memory(
                Memory(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    room_id=room_id,
                    content=f"User: {user_message}",
                    embedding=user_vector,
                    meta={"role": "user"},
                )
            )

            # Store each agent response segment individually
            agent_by_name = {a.name.lower(): a for a in responded_agents}
            segments = ChatWebSocketBroadcaster.parse_transcript(result_text, agent_names)
            for agent_name, content in segments:
                matched = (
                    agent_by_name.get(agent_name.lower())
                    if agent_name
                    else (responded_agents[0] if responded_agents else None)
                )
                agent_vector = await embed(content)
                await self.memory_repo.insert_memory(
                    Memory(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        agent_id=matched.id if matched else None,
                        room_id=room_id,
                        content=f"{agent_name or 'Agent'}: {content}",
                        embedding=agent_vector,
                        meta={"role": "agent", "agent_name": agent_name or ""},
                    )
                )
        except Exception:
            logger.warning("Background memory storage failed for room=%s", room_id, exc_info=True)

    async def update_room_summary_background(
        self, room_id: UUID, conversation_history: list[dict]
    ) -> None:
        """Summarize the conversation history and update the room summary."""
        if not self.chat_repo:
            return

        from app.infrastructure.external.openrouter import structured_completion

        try:
            # Check if history is getting long enough to warrant a summary
            if len(conversation_history) < 25:
                return

            room = await self.chat_repo.get_room(room_id)
            if not room:
                return

            # Build transcript of history to summarize
            lines = []
            for entry in conversation_history:
                name = entry.get("name", "User" if entry.get("role") == "user" else "Agent")
                lines.append(f"{name}: {entry.get('content')}")
            transcript = "\n".join(lines)

            # Build the prompt messages
            current_summary = room.summary or "No previous summary."

            messages: list[dict[str, str]] = [
                {
                    "role": "system",
                    "content": (
                        "You are an AI tasked with maintaining a concise running summary of a chat room conversation. "
                        "Please generate a new, comprehensive but concise summary of the ENTIRE conversation (merging the current summary with the new messages). "
                        "Focus on the main topics discussed, user preferences revealed, and any ongoing tasks or context the agents need to remember."
                    ),
                },
                {
                    "role": "user",
                    "content": f"CURRENT SUMMARY:\n{current_summary}",
                },
                {
                    "role": "user",
                    "content": f"LATEST MESSAGES:\n{transcript}",
                },
            ]

            # Call LLM

            # Ensure model is fetched correctly or hardcode model string if stream_chat accepts it
            model_name = "gpt-4o-mini"
            try:
                from app.core.config import get_settings

                model_name = get_settings().default_chat_model
            except Exception:
                pass

            response = await structured_completion(
                model=model_name,  # Use a fast/cheap model for summarization
                messages=messages,  # type: ignore[arg-type]
                response_model=RoomSummaryResponse,
            )

            new_summary = response.summary.strip()

            if new_summary:
                await self.chat_repo.update_room_summary(room_id, new_summary)
                logger.info("Successfully updated summary for room %s", room_id)

        except Exception:
            logger.warning(
                "Background room summary update failed for room %s", room_id, exc_info=True
            )
