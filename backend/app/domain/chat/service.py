"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import asyncio
import contextlib
import logging
from typing import TYPE_CHECKING, Any

import crewai
from crewai import LLM, Crew, Process, Task

from app.core.config import get_settings
from app.domain.agent_tools.productivity_tools import (
    CreateEventTool,
    CreateNoteTool,
    CreateTaskTool,
    DeleteEventTool,
    ListEventsTool,
    ListNotesTool,
    ListTasksTool,
    UpdateEventTool,
    UpdateTaskTool,
)
from app.domain.chat.models import (
    ChatMessage,
    ChatMessageResponse,
    RoomResponse,
)
from app.infrastructure.external.openrouter import get_openrouter_client
from app.infrastructure.external.steam_tool import SteamOwnedGamesTool, SteamPlayerSummaryTool

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

    from app.domain.agents.models import Agent
    from app.infrastructure.repositories.agent_repo import AgentRepository
    from app.infrastructure.repositories.chat_repo import ChatRepository
    from app.infrastructure.repositories.memory_repo import MemoryRepository

logger = logging.getLogger(__name__)


MULTI_AGENT_PROMPT = (
    "User said: {user_message}. You are managing a group chat. You MUST delegate tasks to EACH "
    "available agent so they can all contribute to the conversation. Ensure they respond to the "
    "user and to each other's points. Gather their responses and return a combined final transcript "
    "of what each agent said."
)

MULTI_AGENT_EXPECTED_OUTPUT = "A chat transcript where multiple agents speak, formatted as 'AgentName: ...\n\nOtherAgent: ...'"


class _OpenRouterLLM(LLM):
    """CrewAI LLM wrapper that supports function calling via OpenRouter.

    CrewAI's built-in OpenAI provider hardcodes ``tool_choice: auto`` whenever
    tools are present, which causes a 404 on many OpenRouter routes that do not
    implement that parameter. This wrapper advertises function-calling support
    by returning ``True`` from ``supports_function_calling`` and drops the
    incompatible ``tool_choice`` parameter via ``additional_drop_params``.
    """

    def supports_function_calling(self) -> bool:
        return True


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

    def _get_crew_llm(self) -> _OpenRouterLLM:
        """Build a CrewAI LLM instance backed by OpenRouter.

        Returns an ``_OpenRouterLLM`` configured to allow function calling
        (``supports_function_calling()`` returns ``True``), but with the
        provider-specific ``tool_choice`` parameter dropped to avoid 404 errors
        on OpenRouter routes that do not implement it.
        """
        settings = get_settings()
        return _OpenRouterLLM(
            model=f"openrouter/{settings.default_chat_model}",
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            additional_drop_params=["tool_choice"],
        )

    def _get_agent_tools(
        self, agent: Agent, user_id: UUID, origin_message_id: UUID | None = None
    ) -> list:
        """Build the tool list for an agent from its prefetched integrations.

        Requires ``agent_integrations__integration`` to have been prefetched
        before calling this method.
        """
        tools = []
        for ai in agent.agent_integrations:  # type: ignore[attr-defined]
            if not ai.enabled:
                continue
            if ai.integration_id == "steam":
                steam_id = ai.config.get("steam_id")
                if steam_id:
                    tools.extend(
                        [
                            SteamPlayerSummaryTool(steam_id=steam_id),
                            SteamOwnedGamesTool(steam_id=steam_id),
                        ]
                    )

        tools.extend(
            [
                ListTasksTool(user_id=user_id, agent_id=agent.id),
                ListEventsTool(user_id=user_id, agent_id=agent.id),
                CreateEventTool(
                    user_id=user_id, agent_id=agent.id, origin_message_id=origin_message_id
                ),
                UpdateEventTool(user_id=user_id, agent_id=agent.id),
                DeleteEventTool(user_id=user_id, agent_id=agent.id),
                CreateTaskTool(user_id=user_id, agent_id=agent.id),
                UpdateTaskTool(user_id=user_id, agent_id=agent.id),
                ListNotesTool(user_id=user_id, agent_id=agent.id),
                CreateNoteTool(
                    user_id=user_id, agent_id=agent.id, origin_message_id=origin_message_id
                ),
            ]
        )

        return tools

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

    async def stream_responses(self, user_message: str, user_id: UUID) -> AsyncIterator[str]:
        """A simple non-room chat stream for general queries using the first available agent."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        llm = get_openrouter_client().openai_client
        agent = db_agents[0]
        # Use the default chat model from settings (configured via env)
        model_name = get_settings().default_chat_model
        response = await llm.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": agent.personality},
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

    def _create_crew_agents(
        self,
        db_agents: list[Agent],
        llm: LLM,
        user_id: UUID,
        allow_delegation: bool = False,
        origin_message_id: UUID | None = None,
    ) -> list[crewai.Agent]:
        """Helper to create crewai.Agent instances from DB agents."""
        return [
            crewai.Agent(
                role=a.name,
                goal=a.personality,
                backstory=a.description or "",
                llm=llm,
                allow_delegation=allow_delegation,
                tools=self._get_agent_tools(a, user_id, origin_message_id=origin_message_id),
            )
            for a in db_agents
        ]

    async def run_crew(self, user_message: str, user_id: UUID) -> dict[str, str]:
        """Execute a full CrewAI orchestration and return a structured result."""
        # list_by_user prefetches agent_integrations__integration
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            return {"task_type": "error", "result": "No agents available."}

        llm = self._get_crew_llm()
        crew_agents = self._create_crew_agents(db_agents, llm, user_id, allow_delegation=True)

        if len(crew_agents) > 1:
            task = Task(
                description=MULTI_AGENT_PROMPT.format(user_message=user_message),
                expected_output=MULTI_AGENT_EXPECTED_OUTPUT,
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.hierarchical,
                manager_llm=llm,
            )
        else:
            task = Task(
                description=user_message,
                expected_output="A comprehensive multi-agent analysis.",
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.sequential,
            )

        result = await crew.kickoff_async()
        return {"task_type": "general", "result": str(result)}

    async def stream_room_responses(
        self, room_id: UUID, user_message: str, user_id: UUID
    ) -> AsyncIterator[str]:
        """The core agentic chat loop using CrewAI."""
        # 1. Save user message
        user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
        await self.chat_repo.save_message(user_msg)

        # 2. Get agents in room (agent_integrations prefetched by list_room_agents)
        db_agents = await self.chat_repo.list_room_agents(room_id)
        if not db_agents:
            yield "No agents in this room. Please add some first."
            return

        # 3. Build CrewAI agents
        llm = self._get_crew_llm()
        crew_agents = self._create_crew_agents(
            db_agents, llm, user_id, allow_delegation=False, origin_message_id=user_msg.id
        )

        # 4. Define and execute task
        if len(crew_agents) > 1:
            task = Task(
                description=MULTI_AGENT_PROMPT.format(user_message=user_message),
                expected_output=MULTI_AGENT_EXPECTED_OUTPUT,
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.hierarchical,
                manager_llm=llm,
                verbose=True,
            )
        else:
            task = Task(
                description=(
                    f"User said: {user_message}. "
                    "Orchestrate a helpful conversation among available agents to assist the user."
                ),
                expected_output="A collaborative response from the most relevant agents.",
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.sequential,
                verbose=True,
            )

        background_task = asyncio.create_task(crew.kickoff_async())
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
        # In a hierarchical multi-agent response, attributing to a single agent
        # is incorrect, so we leave agent_id as None. Otherwise use the single agent's ID.
        agent_id_for_msg = None if len(db_agents) > 1 else db_agents[0].id

        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=agent_id_for_msg,
            content=str(result),
        )
        await self.chat_repo.save_message(agent_msg)

        # 6. Refresh room's updated_at so clients can sort by last activity
        await self.chat_repo.touch_room(room_id)

        # 7. Best-effort message_count increment for each participant.
        # All agents in the room contributed (they were all passed to the crew),
        # so db_agents is the correct participant set.
        # Performance Log: Identified N+1 query in agent message count increment.
        # Reduced database roundtrips from N to 1 by batching the update operation.
        try:
            agent_ids = [agent.id for agent in db_agents]
            if agent_ids:
                await self.agent_repo.increment_message_counts(agent_ids)
        except Exception:
            logger.warning("Failed to increment message_counts for agents in room %s", room_id)

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
    ) -> None:
        """Process a room message and push all updates via the WebSocket hub.

        This is the SignalR-compatible replacement for ``stream_room_responses``.
        Instead of yielding SSE chunks, it broadcasts typed frames to every
        connected client in the room via ``chat_hub``.
        """
        # Import here to avoid circular import at module level
        from app.infrastructure.websocket.manager import chat_hub  # noqa: PLC0415

        # 1. Persist the user message
        user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
        await self.chat_repo.save_message(user_msg)

        # 2. Broadcast the user message to other room members; send a confirmation
        #    frame back to the sender so the frontend can replace the optimistic bubble.
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
        # Sender confirmation includes clientTempId so the UI can swap out the
        # optimistic bubble for the persisted one.
        await chat_hub.send_to_user(
            user_id,
            {
                "type": "message",
                "data": {**user_msg_data, "clientTempId": client_temp_id},
            },
        )

        # 3. Fetch agents
        db_agents = await self.chat_repo.list_room_agents(room_id)
        if not db_agents:
            await chat_hub.broadcast_to_room(
                room_id,
                {"type": "error", "data": {"message": "No agents in this room."}},
            )
            return

        agent_names = [a.name for a in db_agents]

        # 4. Signal "thinking" to all room members
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

        # 5. Build CrewAI agents with a step-callback that broadcasts live activity
        llm = self._get_crew_llm()
        loop = asyncio.get_running_loop()

        def _step_callback(output: Any) -> None:  # noqa: ANN401
            """Translate a CrewAI step output into an agent_activity frame."""
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
            except Exception:
                logger.exception("step_callback error — suppressed")

        crew_agents = self._create_crew_agents(
            db_agents, llm, user_id, allow_delegation=False, origin_message_id=user_msg.id
        )

        if len(crew_agents) > 1:
            task = Task(
                description=MULTI_AGENT_PROMPT.format(user_message=user_message),
                expected_output=MULTI_AGENT_EXPECTED_OUTPUT,
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.hierarchical,
                manager_llm=llm,
                verbose=True,
                step_callback=_step_callback,
            )
        else:
            task = Task(
                description=(
                    f"User said: {user_message}. "
                    "Orchestrate a helpful conversation among available agents to assist the user."
                ),
                expected_output="A collaborative response from the most relevant agents.",
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.sequential,
                verbose=True,
                step_callback=_step_callback,
            )

        result = await crew.kickoff_async()

        # 6. Persist agent response first — only signal done after a successful save
        agent_id_for_msg = None if len(db_agents) > 1 else db_agents[0].id
        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=agent_id_for_msg,
            content=str(result),
        )
        try:
            await self.chat_repo.save_message(agent_msg)
        except Exception:
            logger.exception("Failed to persist agent message  room=%s", room_id)
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
            await chat_hub.broadcast_to_room(
                room_id,
                {"type": "error", "data": {"message": "Failed to save agent response."}},
            )
            return

        # 7. Signal completion (after successful persist)
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

        # 8. Broadcast the agent message to the whole room
        await chat_hub.broadcast_to_room(
            room_id,
            {
                "type": "message",
                "data": {
                    "id": str(agent_msg.id),
                    "room_id": str(room_id),
                    "user_id": None,
                    "agent_id": str(agent_id_for_msg) if agent_id_for_msg else None,
                    "content": str(result),
                    "created_at": agent_msg.created_at.isoformat(),
                },
            },
        )
