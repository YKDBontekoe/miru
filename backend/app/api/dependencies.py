"""FastAPI dependency injection providers."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.domain.agents.service import AgentService
from app.domain.auth.service import AuthService
from app.domain.chat.service import ChatService
from app.domain.integrations.interfaces.steam_client import ISteamClient
from app.domain.integrations.use_cases.resolve_steam_user import ResolveSteamUserUseCase
from app.domain.memory.service import MemoryService
from app.infrastructure.database.supabase import SupabaseClient
from app.infrastructure.external.steam import SteamClient
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.infrastructure.repositories.auth_repo import AuthRepository
from app.infrastructure.repositories.chat_repo import ChatRepository
from app.infrastructure.repositories.memory_repo import MemoryRepository

# ---------------------------------------------------------------------------
# Repository factories
# ---------------------------------------------------------------------------


def get_agent_repo() -> AgentRepository:
    return AgentRepository()


def get_chat_repo() -> ChatRepository:
    return ChatRepository()


def get_memory_repo() -> MemoryRepository:
    return MemoryRepository()


def get_auth_repo(db: SupabaseClient) -> AuthRepository:
    # AuthRepository still uses the Supabase client for passkey tables.
    return AuthRepository(db)


# ---------------------------------------------------------------------------
# Service factories
# ---------------------------------------------------------------------------


def get_agent_service(repo: Annotated[AgentRepository, Depends(get_agent_repo)]) -> AgentService:
    return AgentService(repo)


def get_chat_service(
    chat_repo: Annotated[ChatRepository, Depends(get_chat_repo)],
    agent_repo: Annotated[AgentRepository, Depends(get_agent_repo)],
    memory_repo: Annotated[MemoryRepository, Depends(get_memory_repo)],
    agent_service: Annotated[AgentService, Depends(get_agent_service)],
) -> ChatService:
    return ChatService(chat_repo, agent_repo, memory_repo, agent_service)


def get_memory_service(
    repo: Annotated[MemoryRepository, Depends(get_memory_repo)],
) -> MemoryService:
    return MemoryService(repo)


def get_auth_service(repo: Annotated[AuthRepository, Depends(get_auth_repo)]) -> AuthService:
    return AuthService(repo)


def get_steam_client() -> ISteamClient:
    return SteamClient()


def get_resolve_steam_user_use_case(
    client: Annotated[ISteamClient, Depends(get_steam_client)],
) -> ResolveSteamUserUseCase:
    return ResolveSteamUserUseCase(client)
