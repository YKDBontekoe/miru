"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import crewai
from crewai import LLM, Crew, Process, Task

from app.core.config import get_settings
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


class _OpenRouterLLM(LLM):
    """CrewAI LLM wrapper that forces ReAct-style tool calling.

    CrewAI's built-in OpenAI provider hardcodes ``tool_choice: auto`` whenever
    tools are present, which causes a 404 on OpenRouter routes that don't
    implement that parameter.  Overriding ``supports_function_calling`` to
    return ``False`` makes CrewAI fall back to its ReAct (text-based) tool loop,
    which never sends ``tool_choice`` to the API.
    """

    def supports_function_calling(self) -> bool:
        return False


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

        Returns an ``_OpenRouterLLM`` whose ``supports_function_calling()``
        always returns ``False``, forcing CrewAI into its ReAct (text-based)
        tool loop.  This avoids the ``tool_choice`` parameter that many
        OpenRouter provider routes do not implement.
        """
        settings = get_settings()
        return _OpenRouterLLM(
            model=f"openrouter/{settings.default_chat_model}",
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )

    def _get_agent_tools(self, agent: Agent) -> list:
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
        )

        content = response.choices[0].message.content or "Error: No response from agent."
        yield content
        yield "[[STATUS:done]]\n"

    def _create_crew_agents(
        self, db_agents: list[Agent], llm: LLM, allow_delegation: bool = False
    ) -> list[crewai.Agent]:
        """Helper to create crewai.Agent instances from DB agents."""
        return [
            crewai.Agent(
                role=a.name,
                goal=a.personality,
                backstory=a.description or "",
                llm=llm,
                allow_delegation=allow_delegation,
                tools=self._get_agent_tools(a),
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
        crew_agents = self._create_crew_agents(db_agents, llm, allow_delegation=True)

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
        crew_agents = self._create_crew_agents(db_agents, llm, allow_delegation=False)

        # 4. Define and execute task
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

        result = await crew.kickoff_async()

        # 5. Save agent response
        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=db_agents[0].id,
            content=str(result),
        )
        await self.chat_repo.save_message(agent_msg)

        yield str(result)
        yield "[[STATUS:done]]\n"
