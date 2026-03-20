from __future__ import annotations

from uuid import UUID

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from app.domain.memory.service import MemoryService
from app.infrastructure.repositories.memory_repo import MemoryRepository


def _get_memory_service() -> MemoryService:
    repo = MemoryRepository()
    return MemoryService(repo)


class StoreMemoryInput(BaseModel):
    content: str = Field(..., description="The factual statement or preference to remember.")


class StoreMemoryTool(BaseTool):
    name: str = "store_memory"
    description: str = (
        "Store a factual statement, user preference, or important detail to remember "
        "for future conversations. Use this to remember things the user tells you about "
        "themselves, their likes/dislikes, or instructions they give you."
    )
    args_schema: type[BaseModel] = StoreMemoryInput
    user_id: UUID
    agent_id: UUID

    def _run(self, content: str) -> str:
        raise NotImplementedError("Use _arun instead")

    async def _arun(self, content: str) -> str:
        service = _get_memory_service()
        memory_id = await service.store_memory(
            content=content,
            user_id=self.user_id,
            agent_id=self.agent_id,
        )
        if memory_id:
            return f"Successfully remembered: {content}"
        return f"Failed to remember or already knew: {content}"


class RetrieveMemoryInput(BaseModel):
    query: str = Field(..., description="The topic, question, or keyword to search your memory for.")


class RetrieveMemoryTool(BaseTool):
    name: str = "retrieve_memory"
    description: str = (
        "Search your memory for previously stored facts, user preferences, or past "
        "instructions related to the query."
    )
    args_schema: type[BaseModel] = RetrieveMemoryInput
    user_id: UUID
    agent_id: UUID

    def _run(self, query: str) -> str:
        raise NotImplementedError("Use _arun instead")

    async def _arun(self, query: str) -> str:
        service = _get_memory_service()
        memories = await service.retrieve_memories(
            query=query,
            user_id=self.user_id,
        )
        if not memories:
            return "No relevant memories found."

        results = [f"- {m.content}" for m in memories]
        return "Found the following memories:\n" + "\n".join(results)
