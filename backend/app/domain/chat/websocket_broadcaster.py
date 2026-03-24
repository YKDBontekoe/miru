"""WebSocket broadcasting for the chat domain."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.domain.chat.entities import ChatMessageEntity

if TYPE_CHECKING:
    from app.domain.agents.models import Agent
    from app.infrastructure.repositories.agent_repo import AgentRepository
    from app.infrastructure.repositories.chat_repo import ChatRepository

logger = logging.getLogger(__name__)


class ChatWebSocketBroadcaster:
    """Handles broadcasting events and messages over WebSocket to chat rooms."""

    def __init__(self, chat_repo: ChatRepository, agent_repo: AgentRepository):
        self.chat_repo = chat_repo
        self.agent_repo = agent_repo

    async def handle_message_persistence_and_broadcast(
        self,
        room_id: UUID,
        user_message: str,
        user_id: UUID,
        client_temp_id: str | None = None,
    ) -> ChatMessageEntity:
        """Persist the user message and broadcast to room members."""
        import uuid

        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415
        user_msg = ChatMessageEntity(id=uuid.uuid4(), room_id=room_id, user_id=user_id, content=user_message)
        user_msg = await self.chat_repo.save_message(user_msg)

        user_msg_data = {
            "id": str(user_msg.id),
            "room_id": str(room_id),
            "user_id": str(user_id),
            "agent_id": None,
            "content": user_message,
            "created_at": user_msg.created_at.isoformat(),
        }
        await chat_hub.broadcast_to_room(
            room_id,
            {"type": "message", "data": user_msg_data},
            exclude=user_id,
        )
        await chat_hub.send_to_user(
            user_id,
            {
                "type": "message",
                "data": {**user_msg_data, "clientTempId": client_temp_id},
            },
        )
        return user_msg

    async def broadcast_thinking_status(self, room_id: UUID, agent_names: list[str]) -> None:
        """Broadcast thinking status to all room members."""
        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        await chat_hub.broadcast_to_room(
            room_id,
            {
                "type": "agent_activity",
                "data": {
                    "room_id": str(room_id),
                    "agent_names": agent_names,
                    "activity": "thinking",
                    "detail": "Processing your message…",
                },
            },
        )

    def create_step_callback(self, room_id: UUID, agent_names: list[str]) -> Callable[[Any], None]:
        """Create a callback for CrewAI to broadcast live activity."""
        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        loop = asyncio.get_running_loop()

        def _step_callback(output: Any) -> None:  # noqa: ANN401
            acting_name = "Agent"
            activity = "thinking"
            detail = ""
            try:
                tool_name: str | None = getattr(output, "tool", None)
                if tool_name:
                    activity = "using_tool"
                    detail = f"Using {tool_name}"
                else:
                    log_text = str(getattr(output, "log", ""))
                    activity = "thinking"
                    detail = log_text[:120] if log_text else "Thinking…"

                raw_agent = getattr(output, "agent", None)
                acting_name = (
                    str(raw_agent) if raw_agent else (agent_names[0] if agent_names else "Agent")
                )

                asyncio.run_coroutine_threadsafe(
                    chat_hub.broadcast_to_room(
                        room_id,
                        {
                            "type": "agent_activity",
                            "data": {
                                "room_id": str(room_id),
                                "agent_names": [acting_name],
                                "activity": activity,
                                "detail": detail,
                            },
                        },
                    ),
                    loop,
                )
            except Exception as e:
                logger.exception(
                    "step_callback error — suppressed",
                    extra={
                        "room_id": str(room_id),
                        "acting_name": acting_name,
                        "activity": activity,
                        "detail": detail,
                        "exception": str(e),
                    },
                )

        return _step_callback

    async def persist_and_broadcast_agent_response(
        self,
        room_id: UUID,
        room_agents: list[Agent],
        result_text: str,
        agent_names: list[str],
    ) -> None:
        """Save the agent response and broadcast to room."""
        import uuid

        from tortoise.exceptions import BaseORMException

        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        agent_id_for_msg = None if len(room_agents) > 1 else room_agents[0].id
        agent_msg = ChatMessageEntity(
            id=uuid.uuid4(),
            room_id=room_id,
            agent_id=agent_id_for_msg,
            content=result_text,
        )
        try:
            agent_msg = await self.chat_repo.save_message(agent_msg)
        except BaseORMException:
            logger.exception("Failed to persist agent message  room=%s", room_id)
            raise

        await self.chat_repo.touch_room(room_id)
        for agent in room_agents:
            try:
                await self.agent_repo.increment_message_count(agent.id)
            except BaseORMException:
                logger.warning("Failed to increment message_count for agent %s", agent.id)

        await chat_hub.broadcast_to_room(
            room_id,
            {
                "type": "message",
                "data": {
                    "id": str(agent_msg.id),
                    "room_id": str(room_id),
                    "user_id": None,
                    "agent_id": str(agent_id_for_msg) if agent_id_for_msg else None,
                    "content": result_text,
                    "created_at": agent_msg.created_at.isoformat(),
                },
            },
        )
