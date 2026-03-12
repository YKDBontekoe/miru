"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from crewai import Agent as CrewAgent
from crewai import Crew, Process, Task

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


class ChatService:
    def _get_agent_tools(self, agent: Agent) -> list:
        tools = []
        # Steam integration checks for strings like "steam:<steam_id>"
        for integration in agent.integrations:
            if integration.startswith("steam:"):
                steam_id = integration.split(":", 1)[1]
                tools.extend(
                    [
                        SteamPlayerSummaryTool(steam_id=steam_id),
                        SteamOwnedGamesTool(steam_id=steam_id),
                    ]
                )
        return tools

    def __init__(
        self,
        chat_repo: ChatRepository,
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository,
    ):
        self.chat_repo = chat_repo
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo

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
                room_id=m.room_id,
                user_id=m.user_id,
                agent_id=m.agent_id,
                content=m.content,
                created_at=m.created_at,
            )
            for m in msgs
        ]

    async def stream_responses(self, user_message: str, user_id: UUID) -> AsyncIterator[str]:
        """A simple non-room chat stream for general queries."""
        # 1. Get User Agents
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        # 2. Simple response (as a placeholder for a full agentic loop)
        # In a real scenario, this would orchestrate among agents like stream_room_responses
        llm = get_openrouter_client().openai_client

        # We'll just use the first agent for general chat if no room is specified
        agent = db_agents[0]
        response = await llm.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": agent.personality},
                {"role": "user", "content": user_message},
            ],
        )

        content = response.choices[0].message.content or "Error: No response from agent."
        yield content
        yield "[[STATUS:done]]\n"

    async def run_crew(self, user_message: str, user_id: UUID) -> dict[str, str]:
        """Execute a full CrewAI orchestration and return structured result."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            return {"task_type": "error", "result": "No agents available."}

        llm = get_openrouter_client().openai_client
        crew_agents = [
            CrewAgent(
                role=a.name,
                goal=a.personality,
                backstory=a.description or "",
                llm=llm,
                allow_delegation=True,
                tools=self._get_agent_tools(a),
            )
            for a in db_agents
        ]

        task = Task(
            description=user_message,
            expected_output="A comprehensive multi-agent analysis.",
            agents=list(crew_agents),
        )

        crew = Crew(
            agents=list(crew_agents),
            tasks=[task],
            process=Process.sequential,
        )

        result = await crew.kickoff_async()
        return {"task_type": "general", "result": str(result)}

    async def stream_room_responses(
        self, room_id: UUID, user_message: str, user_id: UUID
    ) -> AsyncIterator[str]:
        """The core agentic chat loop using CrewAI Manager."""
        # 1. Save user message
        user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
        await self.chat_repo.save_message(user_msg)

        # 2. Get Agents in room
        db_agents = await self.chat_repo.list_room_agents(room_id)
        if not db_agents:
            yield "No agents in this room. Please add some first."
            return

        # 3. Initialize CrewAI Agents
        llm = get_openrouter_client().openai_client

        crew_agents = [
            CrewAgent(
                role=a.name,
                goal=a.personality,
                backstory=a.description or "",
                llm=llm,
                allow_delegation=False,
                tools=self._get_agent_tools(a),
            )
            for a in db_agents
        ]

        # 4. Define Task
        task = Task(
            description=f"User said: {user_message}. Orchestrate a helpful conversation among available agents to assist the user.",
            expected_output="A collaborative response from the most relevant agents.",
            agents=list(crew_agents),  # Ensure it's a list
        )

        # 5. Create Crew
        crew = Crew(
            agents=list(crew_agents),
            tasks=[task],
            process=Process.sequential,
            verbose=True,
        )

        # 6. Execute
        result = await crew.kickoff_async()

        # 7. Save agent response
        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=db_agents[0].id,
            content=str(result),
        )
        await self.chat_repo.save_message(agent_msg)

        yield str(result)
        yield "[[STATUS:done]]\n"
