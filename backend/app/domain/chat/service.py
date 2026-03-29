"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

import openai

from app.core.config import get_settings
from app.domain.chat.background_service import ChatBackgroundService
from app.domain.chat.crew_orchestrator import CrewOrchestrator
from app.domain.chat.dtos import ChatMessageResponse, RoomResponse
from app.domain.chat.websocket_broadcaster import ChatWebSocketBroadcaster
from app.infrastructure.external.openrouter import stream_chat

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

    from openai.types.chat import ChatCompletionMessageParam

    from app.domain.agents.entities import AgentEntity
    from app.domain.agents.service import AgentService
    from app.domain.chat.entities import ChatMessageEntity
    from app.infrastructure.repositories.agent_repo import AgentRepository
    from app.infrastructure.repositories.chat_repo import ChatRepository
    from app.infrastructure.repositories.memory_repo import MemoryRepository

logger = logging.getLogger(__name__)

CONVERSATION_HISTORY_LIMIT = 30


class ChatService:
    def __init__(
        self,
        chat_repo: ChatRepository,
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository,
        agent_service: AgentService,
        bg_service: ChatBackgroundService | None = None,
    ):
        self.chat_repo = chat_repo
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo
        self.agent_service = agent_service

        # Initialize the background service
        self.bg_service = ChatBackgroundService(agent_repo, memory_repo, agent_service, chat_repo)

        # Initialize the WebSocket broadcaster
        self.ws_broadcaster = ChatWebSocketBroadcaster(self.chat_repo, self.agent_repo)

    async def create_room(self, name: str, user_id: UUID) -> RoomResponse:
        room = await self.chat_repo.create_room(name, user_id)
        return RoomResponse(
            id=room.id, name=room.name, created_at=room.created_at, updated_at=room.updated_at
        )

    async def list_rooms(self, user_id: UUID) -> list[RoomResponse]:
        rooms = await self.chat_repo.list_rooms(user_id)
        return [
            RoomResponse(id=r.id, name=r.name, created_at=r.created_at, updated_at=r.updated_at)
            for r in rooms
        ]

    async def update_room(self, room_id: UUID, name: str) -> RoomResponse | None:
        room = await self.chat_repo.update_room(room_id, name)
        if room:
            return RoomResponse(
                id=room.id, name=room.name, created_at=room.created_at, updated_at=room.updated_at
            )
        return None

    async def delete_room(self, room_id: UUID) -> bool:
        return await self.chat_repo.delete_room(room_id)

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> None:
        await self.chat_repo.add_agent_to_room(room_id, agent_id)

    async def remove_agent_from_room(self, room_id: UUID, agent_id: UUID) -> bool:
        return await self.chat_repo.remove_agent_from_room(room_id, agent_id)

    async def list_room_agents(self, room_id: UUID) -> list[AgentEntity]:
        return await self.chat_repo.list_room_agents(room_id)

    async def get_room_messages(
        self, room_id: UUID, limit: int = 50, before_id: UUID | None = None
    ) -> list[ChatMessageResponse]:
        msgs = await self.chat_repo.get_room_messages(room_id, limit=limit, before_id=before_id)
        return [
            ChatMessageResponse(
                id=m.id,
                room_id=m.room_id,
                user_id=m.user_id,
                agent_id=m.agent_id,
                content=m.content,
                created_at=m.created_at,
            )
            for m in msgs
        ]

    async def update_message(
        self, message_id: UUID, content: str, user_id: UUID | None = None
    ) -> ChatMessageResponse | None:
        msg = await self.chat_repo.update_message(message_id, content, user_id=user_id)
        if not msg:
            return None
        return ChatMessageResponse(
            id=msg.id,
            room_id=msg.room_id,
            user_id=msg.user_id,
            agent_id=msg.agent_id,
            content=msg.content,
            created_at=msg.created_at,
        )

    async def delete_message(self, message_id: UUID, user_id: UUID | None = None) -> bool:
        return await self.chat_repo.soft_delete_message(message_id, user_id=user_id)

    async def stream_responses(
        self, user_message: str, user_id: UUID, accept_language: str | None = None
    ) -> AsyncIterator[str]:
        """A simple non-room chat stream for general queries using the first available agent."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        agent = db_agents[0]
        model_name = get_settings().default_chat_model

        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": agent.personality}
        ]
        if accept_language:
            messages.append(
                {
                    "role": "system",
                    "content": f"IMPORTANT: Please respond in the following language locale: {accept_language}",
                }
            )
        messages.append({"role": "user", "content": user_message})

        try:
            response = await stream_chat(
                model=model_name,
                messages=messages,
            )

            async for chunk in response:
                if not chunk.choices:
                    continue
                delta_content = chunk.choices[0].delta.content
                if delta_content:
                    yield delta_content
            yield "[[STATUS:done]]\n"
        except TimeoutError:
            logger.warning("Timeout connecting to AI service for user=%s", user_id)
            yield "\n[[STATUS:error]]\nConnection timed out. Please try again later.\n"
        except Exception as e:
            if isinstance(e, (openai.APIConnectionError, openai.APITimeoutError, OSError)):
                logger.warning("Connection error to AI service for user=%s", user_id)
                yield "\n[[STATUS:error]]\nConnection error. Please try again later.\n"
            else:
                logger.exception("Unexpected error in chat stream for user=%s", user_id)
                yield "\n[[STATUS:error]]\nAn unexpected error occurred.\n"

    async def run_crew(
        self, user_message: str, user_id: UUID, accept_language: str | None = None
    ) -> dict[str, str]:
        """Execute a full CrewAI orchestration and return a structured result."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            return {"task_type": "error", "result": "No agents available."}

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=db_agents,
            user_message=user_message,
            user_id=user_id,
            accept_language=accept_language,
        )

        return {"task_type": "general", "result": result}

    @staticmethod
    def _build_history(
        messages: list[ChatMessageEntity], agent_by_id: dict[UUID, str] | None = None
    ) -> list[dict]:
        """Convert stored ChatMessageEntity list to history dicts for the orchestrator.

        ``agent_by_id`` maps agent UUID → agent name so history entries carry
        the real agent name instead of the generic "Agent" fallback.
        """
        history = []
        for m in messages:
            if m.user_id:
                history.append({"role": "user", "name": "User", "content": m.content})
            elif m.agent_id:
                name = (agent_by_id or {}).get(m.agent_id, "Agent")
                history.append({"role": "agent", "name": name, "content": m.content})
        return history

    async def user_in_room(self, user_id: UUID, room_id: UUID) -> bool:
        """Return True if *user_id* owns the room (authorised to send messages)."""
        return await self.chat_repo.room_belongs_to_user(room_id, user_id)

    async def run_room_chat_ws(
        self,
        room_id: UUID,
        user_message: str,
        user_id: UUID,
        client_temp_id: str | None = None,
        accept_language: str | None = None,
    ) -> None:
        """Process a room message and push all updates via the WebSocket hub."""
        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        # 1. Fetch room agents first so we can attach names to history entries.
        room_agents = await self.chat_repo.list_room_agents(room_id)

        # 2. Build conversation history with real agent names before saving the new message.
        prior_messages = await self.chat_repo.get_room_messages(
            room_id, limit=CONVERSATION_HISTORY_LIMIT
        )
        agent_by_id: dict[UUID, str] = {a.id: a.name for a in room_agents}
        conversation_history = self._build_history(prior_messages, agent_by_id)

        # 3. Persist and broadcast the user message.
        user_msg = await self.ws_broadcaster.handle_message_persistence_and_broadcast(
            room_id, user_message, user_id, client_temp_id
        )

        if not room_agents:
            await chat_hub.broadcast_to_room(
                room_id,
                {"type": "error", "data": {"message": "No agents in this room."}},
            )
            return

        # 4. Retrieve relevant memories via vector similarity for extra context.
        memory_context: str | None = None
        try:
            from app.infrastructure.external.openrouter import embed  # noqa: PLC0415

            query_vector = await embed(user_message)
            memories = await self.memory_repo.match_memories(
                vector=query_vector,
                threshold=0.75,
                count=5,
                user_id=user_id,
                room_id=room_id,
            )
            if memories:
                memory_context = "\n".join(f"- {m.content}" for m in memories)
        except Exception:
            logger.warning("Memory retrieval failed for room=%s, proceeding without", room_id)

        # 5. Broadcast thinking indicator and create step callback.
        agent_names = [a.name for a in room_agents]
        agent_name_to_id = {a.name: a.id for a in room_agents}
        await self.ws_broadcaster.broadcast_thinking_status(room_id, agent_names)
        step_callback = self.ws_broadcaster.create_step_callback(
            room_id, agent_names, user_id=user_id, agent_name_to_id=agent_name_to_id
        )

        try:
            # Check room summary to pass as context
            room = await self.chat_repo.get_room(room_id)
            room_summary = room.summary if room else None

            result_text = await CrewOrchestrator.execute_crew_task(
                room_agents=room_agents,
                user_message=user_message,
                user_id=user_id,
                user_msg_id=user_msg.id,
                step_callback=step_callback,
                accept_language=accept_language,
                conversation_history=conversation_history,
                memory_context=memory_context,
                room_summary=room_summary,
            )

            # 6. Persist + broadcast — returns only the agents that actually responded.
            responded_agents = await self.ws_broadcaster.persist_and_broadcast_agent_response(
                room_id, room_agents, result_text, agent_names
            )

            await chat_hub.broadcast_to_room(
                room_id,
                {
                    "type": "agent_activity",
                    "data": {
                        "room_id": str(room_id),
                        "agent_names": agent_names,
                        "activity": "done",
                        "detail": "",
                    },
                },
            )

            # 7. Fire background tasks: mood update, affinity, and memory storage.
            history_text = CrewOrchestrator.format_history(conversation_history)
            recent_context = f"{history_text}\nUser: {user_message}\n{result_text}".strip()

            for agent in responded_agents:
                asyncio.create_task(  # noqa: RUF006
                    self.bg_service.update_mood_background(agent.id, recent_context)
                )
                asyncio.create_task(  # noqa: RUF006
                    self.bg_service.update_affinity_background(user_id, agent.id)
                )

            asyncio.create_task(  # noqa: RUF006
                self.bg_service.store_memories_background(
                    user_id, room_id, user_message, responded_agents, result_text, agent_names
                )
            )

            # Fire background task to update room summary if conversation gets long
            if len(conversation_history) >= CONVERSATION_HISTORY_LIMIT - 5:
                asyncio.create_task(  # noqa: RUF006
                    self.bg_service.update_room_summary_background(room_id, conversation_history)
                )

        except Exception:
            logger.exception("Failed processing crew task for room=%s", room_id)
            await chat_hub.broadcast_to_room(
                room_id,
                {
                    "type": "agent_activity",
                    "data": {
                        "room_id": str(room_id),
                        "agent_names": agent_names,
                        "activity": "error",
                        "detail": "",
                    },
                },
            )
            await chat_hub.broadcast_to_room(
                room_id,
                {"type": "error", "data": {"message": "Something went wrong, please try again."}},
            )
