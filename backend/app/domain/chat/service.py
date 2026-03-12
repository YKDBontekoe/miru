"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from crewai import Agent as CrewAgent
from crewai import Crew, Process, Task

from app.domain.chat.models import ChatMessage, RoomResponse
from app.infrastructure.external.openrouter import get_openrouter_client

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

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

    async def create_room(self, name: str, user_id: UUID) -> RoomResponse:
        room = await self.chat_repo.create_room(name, user_id)
        return RoomResponse(id=room.id, name=room.name, created_at=room.created_at)

    async def list_rooms(self, user_id: UUID) -> list[RoomResponse]:
        rooms = await self.chat_repo.list_rooms(user_id)
        return [RoomResponse(id=r.id, name=r.name, created_at=r.created_at) for r in rooms]

    async def stream_room_responses(
        self, room_id: UUID, user_message: str, user_id: UUID
    ) -> AsyncIterator[str]:
        """The core agentic chat loop using CrewAI Manager."""
        # 1. Save user message
        user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
        await self.chat_repo.save_message(user_msg)

        # 2. Get Agents in room
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available."
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
