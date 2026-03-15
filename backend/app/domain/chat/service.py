"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

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
from app.domain.memory.service import MemoryService
from app.domain.memory.knowledge_graph_service import extract_and_store_graph
from app.domain.agents.affinity_service import increment_affinity, log_agent_action
from app.infrastructure.external.openrouter import get_openrouter_client
from app.infrastructure.external.steam_tool import SteamOwnedGamesTool, SteamPlayerSummaryTool

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

    from app.domain.agents.models import Agent, Memory
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

MULTI_AGENT_EXPECTED_OUTPUT = (
    "A chat transcript where multiple agents speak, formatted as 'AgentName: ...\n\nOtherAgent: ...'"
)

HISTORY_WINDOW = 10  # number of recent messages to inject as conversation context


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


def _format_memory_context(memories: list) -> str:
    """Format retrieved memories into an injectable system prompt section."""
    if not memories:
        return ""
    lines = [f"- {m.content}" for m in memories]
    return "\n[MEMORY CONTEXT]\nRelevant facts about this user:\n" + "\n".join(lines) + "\n"


def _format_history_context(messages: list) -> str:
    """Format recent chat messages into a conversation history block."""
    if not messages:
        return ""
    lines = []
    for m in messages:
        speaker = "User" if m.user_id else "Agent"
        lines.append(f"{speaker}: {m.content}")
    return "\n[CONVERSATION HISTORY]\n" + "\n".join(lines) + "\n"


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
        """Build a CrewAI LLM instance backed by OpenRouter."""
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
        """Build the tool list for an agent from its prefetched integrations."""
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
        return RoomResponse(id=room.id, name=room.name, created_at=room.created_at)

    async def list_rooms(self, user_id: UUID) -> list[RoomResponse]:
        rooms = await self.chat_repo.list_rooms(user_id)
        return [RoomResponse(id=r.id, name=r.name, created_at=r.created_at) for r in rooms]

    async def update_room(self, room_id: UUID, name: str) -> RoomResponse | None:
        room = await self.chat_repo.update_room(room_id, name)
        if room:
            return RoomResponse(id=room.id, name=room.name, created_at=room.created_at)
        return None

    async def delete_room(self, room_id: UUID) -> bool:
        return await self.chat_repo.delete_room(room_id)

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> None:
        await self.chat_repo.add_agent_to_room(room_id, agent_id)

    async def list_room_agents(self, room_id: UUID) -> list[Agent]:
        return await self.chat_repo.list_room_agents(room_id)

    async def get_room_messages(
        self, room_id: UUID, limit: int = 100, offset: int = 0
    ) -> list[ChatMessageResponse]:
        msgs = await self.chat_repo.get_room_messages(room_id, limit=limit, offset=offset)
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
        """Non-room chat stream: retrieves relevant memories and injects them into context."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        agent = db_agents[0]
        memory_svc = MemoryService(self.memory_repo)

        # 1. Retrieve relevant memories
        memories = await memory_svc.retrieve_memories(user_message, user_id=user_id)
        memory_context = _format_memory_context(memories)

        # 2. Build system prompt with memory context
        base_prompt = agent.system_prompt or agent.personality
        system_prompt = base_prompt + memory_context

        llm = get_openrouter_client().openai_client
        model_name = get_settings().default_chat_model
        response = await llm.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )

        content = response.choices[0].message.content or "Error: No response from agent."

        # 3. Store the conversation turn as a memory
        try:
            await memory_svc.store_memory(
                f"User asked: {user_message}\nAgent replied: {content}",
                user_id=user_id,
                agent_id=agent.id,
            )
        except Exception as exc:
            logger.warning("Failed to store memory: %s", exc)

        yield content
        yield "[[STATUS:done]]\n"

    def _create_crew_agents(
        self,
        db_agents: list[Agent],
        llm: LLM,
        user_id: UUID,
        allow_delegation: bool = False,
        origin_message_id: UUID | None = None,
        memory_context: str = "",
        history_context: str = "",
    ) -> list[crewai.Agent]:
        """Helper to create crewai.Agent instances from DB agents."""
        extra_context = history_context + memory_context
        return [
            crewai.Agent(
                role=a.name,
                goal=a.system_prompt or a.personality,
                backstory=(a.description or "") + extra_context,
                llm=llm,
                allow_delegation=allow_delegation,
                tools=self._get_agent_tools(a, user_id, origin_message_id=origin_message_id),
            )
            for a in db_agents
        ]

    async def run_crew(self, user_message: str, user_id: UUID) -> dict[str, str]:
        """Execute a full CrewAI orchestration and return a structured result."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            return {"task_type": "error", "result": "No agents available."}

        memory_svc = MemoryService(self.memory_repo)
        memories = await memory_svc.retrieve_memories(user_message, user_id=user_id)
        memory_context = _format_memory_context(memories)

        llm = self._get_crew_llm()
        crew_agents = self._create_crew_agents(
            db_agents, llm, user_id, allow_delegation=True, memory_context=memory_context
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
        """Room-based agentic chat loop using CrewAI with memory and history context."""
        # 1. Save user message
        user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
        await self.chat_repo.save_message(user_msg)

        # 2. Get agents in room
        db_agents = await self.chat_repo.list_room_agents(room_id)
        if not db_agents:
            yield "No agents in this room. Please add some first."
            return

        memory_svc = MemoryService(self.memory_repo)

        # 3. Retrieve relevant memories and recent conversation history in parallel
        import asyncio as _asyncio
        memories, recent_messages = await _asyncio.gather(
            memory_svc.retrieve_memories(user_message, user_id=user_id, room_id=room_id),
            self.chat_repo.get_recent_messages(room_id, limit=HISTORY_WINDOW),
        )
        memory_context = _format_memory_context(memories)
        # Exclude the message we just saved (it's the last in the list)
        history_context = _format_history_context(recent_messages[:-1])

        # 4. Build CrewAI agents with injected context
        llm = self._get_crew_llm()
        crew_agents = self._create_crew_agents(
            db_agents,
            llm,
            user_id,
            allow_delegation=False,
            origin_message_id=user_msg.id,
            memory_context=memory_context,
            history_context=history_context,
        )

        # 5. Define and execute task
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
            task_description = (
                f"{history_context}\n[CURRENT MESSAGE]\n"
                f"User said: {user_message}. "
                "Orchestrate a helpful conversation among available agents to assist the user."
            )
            task = Task(
                description=task_description,
                expected_output="A collaborative response from the most relevant agents.",
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.sequential,
                verbose=True,
            )

        result = await crew.kickoff_async()
        result_str = str(result)

        # 6. Save agent response
        agent_id_for_msg = None if len(db_agents) > 1 else db_agents[0].id
        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=agent_id_for_msg,
            content=result_str,
        )
        await self.chat_repo.save_message(agent_msg)

        # 7. Store conversation turn as memory (non-blocking)
        try:
            await memory_svc.store_memory(
                f"User asked: {user_message}\nAgent replied: {result_str}",
                user_id=user_id,
                room_id=room_id,
            )
        except Exception as exc:
            logger.warning("Failed to store room memory: %s", exc)

        # 8. Knowledge graph extraction (background task)
        import asyncio as _asyncio
        _asyncio.create_task(
            extract_and_store_graph(
                f"User: {user_message}\nAgent: {result_str}", user_id, self.memory_repo
            )
        )

        # 9. Affinity increment + action log for each room agent
        for db_agent in db_agents:
            level_up = await increment_affinity(user_id, db_agent.id)
            if level_up:
                yield level_up + "\n"
            await log_agent_action(
                user_id=user_id,
                agent_id=db_agent.id,
                action_type="chat_response",
                content=result_str[:500],
                room_id=room_id,
                meta={"message_length": len(result_str)},
            )

        yield result_str
        yield "[[STATUS:done]]\n"
