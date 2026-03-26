"""WebSocket broadcasting for the chat domain."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
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
        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        user_msg = ChatMessageEntity(
            id=uuid.uuid4(), room_id=room_id, user_id=user_id, content=user_message
        )
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

    @staticmethod
    def parse_transcript(result_text: str, agent_names: list[str]) -> list[tuple[str, str]]:
        """Parse a multi-agent transcript into (agent_name, message) pairs.

        Expected format: structured JSON object outputted from CrewAI output_pydantic mapping.
        Falls back to a single unnamed entry when the format cannot be parsed.
        """
        if not agent_names or len(agent_names) == 1:
            try:
                data = json.loads(result_text)
                if isinstance(data, dict) and "message" in data:
                    return [("", data["message"].strip())]
            except Exception:
                pass
            return [("", result_text.strip())]

        name_set = {n.lower() for n in agent_names}
        try:
            data = json.loads(result_text)
            if isinstance(data, dict) and "messages" in data and isinstance(data["messages"], list):
                segments = []
                for entry in data["messages"]:
                    if isinstance(entry, dict) and "agent_name" in entry and "message" in entry:
                        agent_name = entry["agent_name"].strip()
                        if agent_name.lower() in name_set:
                            segments.append((agent_name, entry["message"].strip()))
                if segments:
                    return segments
        except Exception:
            pass

        return ([] if not result_text.strip() else [("", result_text.strip())])

    async def persist_and_broadcast_agent_response(
        self,
        room_id: UUID,
        room_agents: list[Agent],
        result_text: str,
        agent_names: list[str],
    ) -> list[Agent]:
        """Save the agent response(s) and broadcast to room.

        For multi-agent rooms the transcript is split into individual per-agent
        messages so each agent's reply appears in its own bubble.

        Returns the list of agents who actually produced a response segment so
        that the caller can run per-agent post-processing (mood, affinity, etc.).
        """
        from tortoise.exceptions import BaseORMException

        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        agent_by_name = {a.name.lower(): a for a in room_agents}
        segments = self.parse_transcript(result_text, agent_names)

        responded: list[Agent] = []

        # Persist and broadcast each segment as a separate message
        for agent_name, content in segments:
            matched_agent = agent_by_name.get(agent_name.lower())
            # Single-agent fallback: attribute the message to the only agent in the room.
            effective_agent = matched_agent or (room_agents[0] if len(room_agents) == 1 else None)
            agent_id_for_msg = effective_agent.id if effective_agent else None

            if effective_agent and effective_agent not in responded:
                responded.append(effective_agent)

            msg_entity = ChatMessageEntity(
                id=uuid.uuid4(),
                room_id=room_id,
                agent_id=agent_id_for_msg,
                content=content,
            )
            try:
                msg_entity = await self.chat_repo.save_message(msg_entity)
            except BaseORMException:
                logger.exception("Failed to persist agent message room=%s", room_id)
                raise

            await chat_hub.broadcast_to_room(
                room_id,
                {
                    "type": "message",
                    "data": {
                        "id": str(msg_entity.id),
                        "room_id": str(room_id),
                        "user_id": None,
                        "agent_id": str(agent_id_for_msg) if agent_id_for_msg else None,
                        "content": content,
                        "created_at": msg_entity.created_at.isoformat(),
                    },
                },
            )

        await self.chat_repo.touch_room(room_id)

        # Only increment message_count for agents that actually responded.
        for agent in responded:
            try:
                await self.agent_repo.increment_message_count(agent.id)
            except BaseORMException:
                logger.warning("Failed to increment message_count for agent %s", agent.id)

        return responded
