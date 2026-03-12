"""FastAPI dependency injection providers."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession  # noqa: TCH002
from supabase import Client  # noqa: TCH002

from app.domain.agents.service import AgentService
from app.domain.auth.service import AuthService
from app.domain.chat.service import ChatService
from app.domain.memory.service import MemoryService
from app.infrastructure.database.sqlmodel import get_session
from app.infrastructure.database.supabase import get_supabase
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.infrastructure.repositories.auth_repo import AuthRepository
from app.infrastructure.repositories.chat_repo import ChatRepository
from app.infrastructure.repositories.memory_repo import MemoryRepository

# Repositories


def get_agent_repo(session: Annotated[AsyncSession, Depends(get_session)]) -> AgentRepository:
    return AgentRepository(session)


def get_chat_repo(session: Annotated[AsyncSession, Depends(get_session)]) -> ChatRepository:
    return ChatRepository(session)


async def get_memory_repo(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MemoryRepository:
    return MemoryRepository(session)


def get_auth_repo(db: Annotated[Client, Depends(get_supabase)]) -> AuthRepository:
    # AuthRepository still uses Supabase client for WebAuthn/Passkey tables for now
    return AuthRepository(db)


# Services


def get_agent_service(repo: Annotated[AgentRepository, Depends(get_agent_repo)]) -> AgentService:
    return AgentService(repo)


def get_chat_service(
    chat_repo: Annotated[ChatRepository, Depends(get_chat_repo)],
    agent_repo: Annotated[AgentRepository, Depends(get_agent_repo)],
    memory_repo: Annotated[MemoryRepository, Depends(get_memory_repo)],
) -> ChatService:
    return ChatService(chat_repo, agent_repo, memory_repo)


def get_memory_service(
    repo: Annotated[MemoryRepository, Depends(get_memory_repo)],
) -> MemoryService:
    return MemoryService(repo)


def get_auth_service(repo: Annotated[AuthRepository, Depends(get_auth_repo)]) -> AuthService:
    return AuthService(repo)
