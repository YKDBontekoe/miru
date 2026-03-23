"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import asyncio
import contextlib
import logging
from typing import TYPE_CHECKING

from app.core.config import get_settings
from app.domain.chat.crew_orchestrator import CrewOrchestrator
from app.domain.chat.models import (
    ChatMessage,
    ChatMessageResponse,
    RoomResponse,
)
from app.domain.chat.websocket_broadcaster import ChatWebSocketBroadcaster
from app.infrastructure.external.openrouter import get_openrouter_client

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

    from app.domain.agents.models import Agent
    from app.infrastructure.repositories.agent_repo import AgentRepository
    from app.infrastructure.repositories.chat_repo import ChatRepository
    from app.infrastructure.repositories.memory_repo import MemoryRepository

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(
        self,
        chat_repo: ChatRepository,
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository,
    ):
        self.chat_repo = chat_repo
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo
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

    async def list_room_agents(self, room_id: UUID) -> list[Agent]:
        return await self.chat_repo.list_room_agents(room_id)

    async def get_room_messages(self, room_id: UUID) -> list[ChatMessageResponse]:
        msgs = await self.chat_repo.get_room_messages(room_id)
        return [
            ChatMessageResponse(
                id=m.id,
                room_id=getattr(m, "room_id"),  # noqa: B009
                user_id=m.user_id,
                agent_id=m.agent_id,
                content=m.content,
                created_at=m.created_at,
            )
            for m in msgs
        ]

    async def stream_responses(
        self, user_message: str, user_id: UUID, accept_language: str | None = None
    ) -> AsyncIterator[str]:
        """A simple non-room chat stream for general queries using the first available agent."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        llm = get_openrouter_client().openai_client
        agent = db_agents[0]
        model_name = get_settings().default_chat_model

        system_message = agent.personality
        if accept_language:
            system_message += (
                f"\n\nIMPORTANT: Please respond in the following language locale: {accept_language}"
            )

        response = await llm.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            stream=True,
        )

        async for chunk in response:
            if not chunk.choices:
                continue
            delta_content = chunk.choices[0].delta.content
            if delta_content:
                yield delta_content
        yield "[[STATUS:done]]\n"

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
            allow_delegation=True,
        )

        return {"task_type": "general", "result": result}

    async def stream_room_responses(
        self, room_id: UUID, user_message: str, user_id: UUID, accept_language: str | None = None
    ) -> AsyncIterator[str]:
        """The core agentic chat loop using CrewAI."""
        # 1. Save user message
        user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
        await self.chat_repo.save_message(user_msg)

        # 2. Get agents in room
        db_agents = await self.chat_repo.list_room_agents(room_id)
        if not db_agents:
            yield "No agents in this room. Please add some first."
            return

        # 3. Create background task to execute Crew
        background_task = asyncio.create_task(
            CrewOrchestrator.execute_crew_task(
                room_agents=db_agents,
                user_message=user_message,
                user_id=user_id,
                user_msg_id=user_msg.id,
                accept_language=accept_language,
                allow_delegation=False,
            )
        )

        try:
            while not background_task.done():
                yield "[[STATUS:thinking]]\n"
                await asyncio.sleep(2)
            result = background_task.result()
        finally:
            if not background_task.done():
                background_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await background_task

        # 5. Save agent response
        agent_id_for_msg = None if len(db_agents) > 1 else db_agents[0].id
        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=agent_id_for_msg,
            content=result,
        )
        await self.chat_repo.save_message(agent_msg)

        # 6. Refresh room's updated_at
        await self.chat_repo.touch_room(room_id)

        # 7. Increment message count
        for agent in db_agents:
            try:
                await self.agent_repo.increment_message_count(agent.id)
            except Exception:
                logger.warning("Failed to increment message_count for agent %s", agent.id)

        yield str(result)
        yield "[[STATUS:done]]\n"

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

        user_msg = await self.ws_broadcaster.handle_message_persistence_and_broadcast(
            room_id, user_message, user_id, client_temp_id
        )

        room_agents = await self.chat_repo.list_room_agents(room_id)
        if not room_agents:
            await chat_hub.broadcast_to_room(
                room_id,
                {"type": "error", "data": {"message": "No agents in this room."}},
            )
            return

        agent_names = [a.name for a in room_agents]
        await self.ws_broadcaster.broadcast_thinking_status(room_id, agent_names)
        step_callback = self.ws_broadcaster.create_step_callback(room_id, agent_names)

        try:
            result_text = await CrewOrchestrator.execute_crew_task(
                room_agents=room_agents,
                user_message=user_message,
                user_id=user_id,
                user_msg_id=user_msg.id,
                step_callback=step_callback,
                accept_language=accept_language,
                allow_delegation=False,
            )

            await self.ws_broadcaster.persist_and_broadcast_agent_response(
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
        except Exception as e:
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
                {"type": "error", "data": {"message": f"Processing error: {e!s}"}},
            )
