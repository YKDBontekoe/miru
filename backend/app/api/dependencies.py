"""FastAPI dependency injection providers."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import Depends

from app.domain.agents.service import AgentService
from app.domain.auth.service import AuthService
from app.domain.chat.service import ChatService
from app.domain.memory.service import MemoryService
from app.infrastructure.database.neo4j import get_neo4j_driver
from app.infrastructure.database.supabase import get_supabase
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.infrastructure.repositories.auth_repo import AuthRepository
from app.infrastructure.repositories.chat_repo import ChatRepository
from app.infrastructure.repositories.memory_repo import MemoryRepository

if TYPE_CHECKING:
    from neo4j import AsyncDriver
    from supabase import Client

# Repositories

def get_agent_repo(db: Annotated[Client, Depends(get_supabase)]) -> AgentRepository:
    return AgentRepository(db)

def get_chat_repo(db: Annotated[Client, Depends(get_supabase)]) -> ChatRepository:
    return ChatRepository(db)

async def get_memory_repo(
    db: Annotated[Client, Depends(get_supabase)],
    graph_driver: Annotated[AsyncDriver, Depends(get_neo4j_driver)],
) -> MemoryRepository:
    return MemoryRepository(db, graph_driver)

def get_auth_repo(db: Annotated[Client, Depends(get_supabase)]) -> AuthRepository:
    return AuthRepository(db)

# Services

def get_agent_service(repo: Annotated[AgentRepository, Depends(get_agent_repo)]) -> AgentService:
    return AgentService(repo)

def get_chat_service(
    chat_repo: Annotated[ChatRepository, Depends(get_chat_repo)],
    agent_repo: Annotated[AgentRepository, Depends(get_agent_repo)],
    memory_repo: Annotated[MemoryRepository, Depends(get_memory_repo)]
) -> ChatService:
    return ChatService(chat_repo, agent_repo, memory_repo)

async def get_memory_service(
    repo: Annotated[MemoryRepository, Depends(get_memory_repo)]
) -> MemoryService:
    return MemoryService(repo)

def get_auth_service(repo: Annotated[AuthRepository, Depends(get_auth_repo)]) -> AuthService:
    return AuthService(repo)
