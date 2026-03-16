# Miru Codebase Analysis — Parallel Agent Task Prompts

## Context

Miru is a personal AI assistant with persistent memory, built on FastAPI (Python) + Flutter (Dart), using Supabase (PostgreSQL + pgvector) for storage, CrewAI for multi-agent orchestration, and OpenRouter as the LLM gateway. The task is to read the entire codebase, deeply understand it, and produce fully self-contained, parallel agent task prompts across seven domains: Architecture, New Features, Refactoring, Security, Performance, Testing, and Dependencies.

Each task below is fully self-contained with inline file contents and actionable next steps.

---

## TASK AUDIT-001

**TASK ID:** AUDIT-001
**PRIORITY:** 🔴 Critical
**DOMAIN:** Architecture

You are a senior software architect.

You have been given the following codebase to review:
- `backend/app/domain/chat/service.py`
- `backend/app/domain/memory/service.py`
- `backend/app/infrastructure/repositories/memory_repo.py`
- `backend/app/api/dependencies.py`
- `backend/app/api/v1/chat.py`
- `backend/app/core/config.py`

Here is the full content of each file:

**backend/app/domain/chat/service.py**
```python
"""Chat service for business logic and CrewAI orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import crewai
from crewai import LLM, Crew, Process, Task

from app.core.config import get_settings
from app.domain.agent_tools.productivity_tools import (
    CreateEventTool, CreateNoteTool, CreateTaskTool, DeleteEventTool,
    ListEventsTool, ListNotesTool, ListTasksTool, UpdateEventTool, UpdateTaskTool,
)
from app.domain.chat.models import ChatMessage, ChatMessageResponse, RoomResponse
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
    def supports_function_calling(self) -> bool:
        return True


class ChatService:
    def __init__(self, chat_repo: ChatRepository, agent_repo: AgentRepository, memory_repo: MemoryRepository):
        self.chat_repo = chat_repo
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo  # ← INJECTED BUT NEVER USED

    def _get_crew_llm(self) -> _OpenRouterLLM:
        settings = get_settings()
        return _OpenRouterLLM(
            model=f"openrouter/{settings.default_chat_model}",
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            additional_drop_params=["tool_choice"],
        )

    def _get_agent_tools(self, agent: Agent, user_id: UUID, origin_message_id: UUID | None = None) -> list:
        tools = []
        for ai in agent.agent_integrations:
            if not ai.enabled:
                continue
            if ai.integration_id == "steam":
                steam_id = ai.config.get("steam_id")
                if steam_id:
                    tools.extend([SteamPlayerSummaryTool(steam_id=steam_id), SteamOwnedGamesTool(steam_id=steam_id)])
        tools.extend([
            ListTasksTool(user_id=user_id, agent_id=agent.id),
            ListEventsTool(user_id=user_id, agent_id=agent.id),
            CreateEventTool(user_id=user_id, agent_id=agent.id, origin_message_id=origin_message_id),
            UpdateEventTool(user_id=user_id, agent_id=agent.id),
            DeleteEventTool(user_id=user_id, agent_id=agent.id),
            CreateTaskTool(user_id=user_id, agent_id=agent.id),
            UpdateTaskTool(user_id=user_id, agent_id=agent.id),
            ListNotesTool(user_id=user_id, agent_id=agent.id),
            CreateNoteTool(user_id=user_id, agent_id=agent.id, origin_message_id=origin_message_id),
        ])
        return tools

    async def stream_responses(self, user_message: str, user_id: UUID) -> AsyncIterator[str]:
        """A simple non-room chat stream — bypasses CrewAI and memory entirely."""
        db_agents = await self.agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        llm = get_openrouter_client().openai_client
        agent = db_agents[0]
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

    # ... (run_crew, stream_room_responses omitted for brevity but follow same pattern)
```

**backend/app/domain/memory/service.py**
```python
"""Memory service for business logic and vector/graph integration."""

from __future__ import annotations
import logging
from typing import TYPE_CHECKING, Any
from uuid import UUID
from app.domain.memory.models import Memory
from app.infrastructure.external.openrouter import embed

if TYPE_CHECKING:
    from app.infrastructure.repositories.memory_repo import MemoryRepository

logger = logging.getLogger(__name__)
TOP_K = 5
DEDUP_THRESHOLD = 0.97


class MemoryService:
    def __init__(self, repo: MemoryRepository):
        self.repo = repo

    async def store_memory(self, content: str, user_id=None, agent_id=None, room_id=None, related_to=None) -> UUID | None:
        content = content.strip()
        if not content: return None
        vector = await embed(content)
        # ... dedup check, insert, relationship creation

    async def retrieve_memories(self, query: str, user_id=None, agent_id=None, room_id=None) -> list[Memory]:
        vector = await embed(query) if query else [0.0] * 1536
        return await self.repo.match_memories(vector, 0.0, 5, ...)
```

**backend/app/api/dependencies.py**
```python
def get_chat_service(
    chat_repo: Annotated[ChatRepository, Depends(get_chat_repo)],
    agent_repo: Annotated[AgentRepository, Depends(get_agent_repo)],
    memory_repo: Annotated[MemoryRepository, Depends(get_memory_repo)],
) -> ChatService:
    return ChatService(chat_repo, agent_repo, memory_repo)
    # memory_repo IS passed in but ChatService never calls self.memory_repo
```

**Background:** Miru's core value proposition — as stated in the README — is "Every conversation you have is stored as a vector embedding" and "Automatically retrieves relevant memories based on context similarity." However, the `ChatService` receives `MemoryRepository` in its constructor but **never calls it**. The `stream_responses` method (the default chat path from `/api/v1/chat`) bypasses CrewAI, skips memory retrieval entirely, uses only the agent's `personality` as the system prompt, and doesn't store the conversation as a memory afterward. The `stream_room_responses` method (room-based chat) also skips memory. The memory system exists and works independently (via `/api/v1/memory`) but is completely disconnected from the chat pipeline. This is the single most critical architectural flaw in the codebase.

**Your job is to:**

1. Diagnose exactly why memory retrieval is disconnected (trace through `stream_responses` → no `memory_repo` calls, no `MemoryService` use, agent system_prompt has no memory injection)
2. Design the memory-chat integration pipeline:
   - On user message received: call `MemoryService.retrieve_memories(query=user_message, user_id=user_id)` to fetch top-K relevant memories
   - Inject retrieved memories into the agent's system prompt as a `[MEMORY CONTEXT]` section
   - After successful response: call `MemoryService.store_memory(content=user_message, user_id=user_id)` to store the conversation turn
3. Decide where this logic lives — in `ChatService` (preferred, it already holds `memory_repo`) or as a middleware layer
4. Handle the CrewAI path in `stream_room_responses`: inject memories into each `crewai.Agent`'s backstory or system prompt
5. Propose the exact code changes with before/after diffs
6. Identify the asymmetry between `stream_responses` and `stream_room_responses` and suggest merging them under a common memory-aware base path

**Next steps (prioritized for tomorrow):**

1. In `ChatService.stream_responses` (`chat/service.py:173`), add: `memories = await MemoryService(self.memory_repo).retrieve_memories(user_message, user_id=user_id)` before the LLM call
2. Build `_format_memory_context(memories: list[Memory]) -> str` helper that formats memories into an injected system prompt section
3. Patch `stream_responses` to prepend memory context to `agent.personality` or `agent.system_prompt`
4. Add post-response `store_memory` call after the LLM response is received
5. Repeat for `stream_room_responses` — inject memories into `crewai.Agent(backstory=...)`
6. Add integration test that sends a message, then queries memory, then verifies the second response references stored context

---

## TASK AUDIT-002

**TASK ID:** AUDIT-002
**PRIORITY:** 🔴 Critical
**DOMAIN:** New Features — Memory-Aware Chat Context Injection

You are a product engineer and AI systems designer.

You have been given the following codebase to review:
- `backend/app/domain/chat/service.py`
- `backend/app/domain/memory/service.py`
- `backend/app/domain/memory/models.py`
- `backend/app/domain/agents/models.py`
- `backend/app/infrastructure/external/openrouter.py`

Here is the full content of each file:

**backend/app/domain/memory/models.py**
```python
class Memory(SupabaseModel):
    id: UUID
    user_id: UUID | None
    agent_id: UUID | None
    room_id: UUID | None
    content: str
    embedding: list[float]  # vector(1536) in Postgres
    meta: dict
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

class MemoryCollection(SupabaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None

class MemoryGraphNode(SupabaseModel):
    id: UUID
    user_id: UUID | None
    name: str
    entity_type: str  # e.g. "person", "place", "concept"
    description: str | None
    meta: dict

class MemoryGraphEdge(SupabaseModel):
    id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relationship: str  # e.g. "works_at", "likes", "knows"
    weight: float
```

**backend/app/domain/agents/models.py** (relevant excerpt)
```python
class UserAgentAffinity(SupabaseModel):
    user_id: UUID
    agent_id: UUID
    affinity_score: float = 0.0
    trust_level: int = 1
    milestones: list = []
    last_interaction_at: datetime

class AgentActionLog(SupabaseModel):
    id: UUID
    user_id: UUID
    agent_id: UUID
    room_id: UUID | None
    action_type: str
    content: str
    meta: dict
```

**Background:** Miru has three dormant systems that are modeled in the database but never populated by any code: (1) `MemoryGraphNode/MemoryGraphEdge` — a knowledge graph that should extract entities and relationships from conversations; (2) `UserAgentAffinity` — a relationship-tracking system between users and agents that should grow with interactions; (3) `AgentActionLog` — an audit trail of agent thoughts and tool uses. These are high-value features that are architecturally planned but completely unimplemented. Bringing them to life would differentiate Miru from any generic chatbot.

**Your job is to implement the Knowledge Graph Extraction feature:**

1. After each chat turn, use an LLM call (via `structured_completion`) to extract entities and relationships from the conversation turn. Example prompt: "Extract named entities (people, places, concepts) and their relationships from this text: {text}. Return JSON with entities: [{name, type, description}] and relations: [{from, to, relationship}]."
2. Store extracted entities as `MemoryGraphNode` records (with deduplication on `name + entity_type + user_id`)
3. Store extracted relationships as `MemoryGraphEdge` records
4. Link memories (`Memory` table) to graph nodes via a new `meta.graph_node_ids` field
5. Expose graph data through the existing `/api/v1/memory/graph` endpoint (already exists at `memory.py:36-47`)
6. Implement `UserAgentAffinity` incrementing: each chat turn should increment `affinity_score` by 1.0 and update `last_interaction_at`. At score milestones (10, 25, 50, 100), add a milestone entry and emit `[[STATUS:level_up:{agent_id}:{level}]]` in the stream (the frontend already handles this at `group_chat_page.dart:142-166`)
7. Write `AgentActionLog` entries whenever a CrewAI tool is invoked (tool name, input/output in meta)

**Next steps (prioritized for tomorrow):**

1. Create `KnowledgeGraphService` in `backend/app/domain/memory/` with `extract_and_store_graph(text: str, user_id: UUID) -> None`
2. Add `_extract_entities_and_relations(text) -> dict` using `structured_completion` with a new `EntityExtractionResponse` Pydantic model
3. Wire `KnowledgeGraphService.extract_and_store_graph()` into `ChatService.stream_room_responses` as a background task (don't block the stream)
4. Implement `AffinityService` with `increment(user_id, agent_id) -> level_up_event | None`
5. Add affinity increment call in `ChatService` after each successful agent response
6. Create `AgentActionLogRepository` and log tool invocations via a CrewAI callback hook

---

## TASK AUDIT-003

**TASK ID:** AUDIT-003
**PRIORITY:** 🔴 Critical
**DOMAIN:** Security — Stub WebAuthn & Credential Exposure

You are a security engineer specializing in authentication systems.

You have been given the following codebase to review:
- `backend/app/api/v1/auth.py`
- `backend/app/domain/auth/service.py`
- `backend/app/domain/agents/models.py`
- `backend/app/core/config.py`
- `backend/app/core/security/auth.py`

Here is the full content of each file:

**backend/app/api/v1/auth.py**
```python
@router.post("/passkey/register/options")
async def get_registration_options(...) -> dict[str, Any]:
    """Get options for passkey registration."""
    # Placeholder for actual WebAuthn logic
    return {"challenge": "dummy_challenge", "rp": {"name": "Miru", "id": "localhost"}}

@router.post("/passkey/login/options")
async def get_login_options(...) -> dict[str, Any]:
    """Get options for passkey login."""
    return {"challenge": "dummy_challenge"}

@router.post("/passkey/login/verify")
async def verify_login(...) -> dict[str, Any]:
    """Verify passkey login and return tokens."""
    return {
        "access_token": "dummy_access_token",
        "refresh_token": "dummy_refresh_token",
    }
```

**backend/app/domain/auth/service.py**
```python
async def verify_registration(self, challenge: str, credential_json: str) -> None:
    """Skeleton for Authlib WebAuthn registration verification."""
    # Implementation would use Authlib to validate credential_json
    pass  # ← EMPTY STUB
```

**backend/app/domain/agents/models.py** (relevant excerpt)
```python
class AgentIntegration(SupabaseModel):
    config: dict = fields.JSONField(default={})
    credentials: dict = fields.JSONField(default={})  # ← plaintext sensitive data in DB
```

**backend/app/core/config.py**
```python
cors_allowed_origins: str = "*"  # ← wildcard default
```

**Background:** Miru advertises WebAuthn/Passkey authentication as a feature (frontend `PasskeyService` exists, `pyproject.toml` includes `webauthn>=2.7.0` and `authlib>=1.3.0`), but the entire passkey flow is a stub returning hardcoded dummy values. Any client calling `/api/v1/auth/passkey/login/verify` receives `dummy_access_token` — this endpoint is live in production and bypasses all authentication. Additionally, the `AgentIntegration.credentials` field stores third-party service credentials (API keys, tokens) as plaintext JSONB in the database with no encryption. The CORS origin defaults to `"*"`.

**Your job is to:**

1. **Document the full attack surface** of the current stub auth: any unauthenticated actor can receive a "valid" access token by hitting the passkey verify endpoint
2. **Implement real WebAuthn registration and login** using the already-imported `webauthn` library:
   - `generate_registration_options()` → return proper challenge + RP info
   - `verify_registration_response()` → validate credential and store in `passkeys` table
   - `generate_authentication_options()` → return challenge + allowCredentials
   - `verify_authentication_response()` → validate assertion, return real Supabase session token
3. **Encrypt `credentials` field**: propose using Fernet (symmetric) encryption with a `CREDENTIALS_ENCRYPTION_KEY` env var; credentials are encrypted before INSERT and decrypted on SELECT
4. **Harden CORS**: change the `cors_allowed_origins` default to `""` (empty = no origins allowed) so it fails closed in misconfiguration
5. **Add rate limiting** to auth endpoints using a FastAPI middleware or `slowapi`

**Next steps (prioritized for tomorrow):**

1. Replace `get_registration_options` stub with real `webauthn.generate_registration_options()` call
2. Replace `verify_registration` stub body with `webauthn.verify_registration_response()` + store credential
3. Replace `get_login_options` stub with `webauthn.generate_authentication_options()`
4. Replace `verify_login` stub with `webauthn.verify_authentication_response()` + mint Supabase session
5. Add `CREDENTIALS_ENCRYPTION_KEY` to `Settings` and add encrypt/decrypt utilities
6. Wrap `AgentIntegration` save/load to encrypt/decrypt the `credentials` field
7. Change `cors_allowed_origins` default to `""` and document it in `.env.example`

---

## TASK AUDIT-004

**TASK ID:** AUDIT-004
**PRIORITY:** 🟡 Important
**DOMAIN:** Refactoring — ChatService Architectural Incoherence

You are a senior software engineer focused on clean architecture.

You have been given the following codebase to review:
- `backend/app/domain/chat/service.py`
- `backend/app/api/v1/chat.py`
- `backend/app/domain/agents/service.py`
- `backend/app/infrastructure/repositories/agent_repo.py`

Here is the full content of each file:

**backend/app/domain/chat/service.py** (key methods)
```python
async def stream_responses(self, user_message: str, user_id: UUID) -> AsyncIterator[str]:
    """A simple non-room chat stream for general queries using the first available agent."""
    db_agents = await self.agent_repo.list_by_user(user_id)
    if not db_agents:
        yield "No agents available. Please create one first."
        return

    llm = get_openrouter_client().openai_client  # ← raw OpenAI client
    agent = db_agents[0]
    model_name = get_settings().default_chat_model
    response = await llm.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": agent.personality},  # ← uses personality, not system_prompt
            {"role": "user", "content": user_message},
        ],
    )
    content = response.choices[0].message.content or "Error: No response from agent."
    yield content
    yield "[[STATUS:done]]\n"

async def stream_room_responses(self, room_id: UUID, user_message: str, user_id: UUID) -> AsyncIterator[str]:
    """The core agentic chat loop using CrewAI."""
    user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
    await self.chat_repo.save_message(user_msg)

    db_agents = await self.chat_repo.list_room_agents(room_id)
    if not db_agents:
        yield "No agents in this room. Please add some first."
        return

    llm = self._get_crew_llm()  # ← CrewAI LLM
    crew_agents = self._create_crew_agents(db_agents, llm, user_id, allow_delegation=False, ...)
    # ... CrewAI orchestration
    result = await crew.kickoff_async()
    await self.chat_repo.save_message(agent_msg)
    yield str(result)
    yield "[[STATUS:done]]\n"
```

**backend/app/domain/agents/service.py** (relevant stub)
```python
async def update_mood(self, agent_id: UUID | str, recent_history: str) -> None:
    """Analyze history and update agent mood via repository."""
    if not recent_history.strip():
        return
    await self.repo.update_mood(agent_id, "Optimistic")  # ← ALWAYS "Optimistic", ignores history
```

**Background:** `ChatService` has two parallel streaming paths: `stream_responses` (non-room, raw OpenAI, uses personality string) and `stream_room_responses` (room-based, CrewAI, uses system_prompt). They have completely diverged. `stream_responses` does not save messages, does not use CrewAI, does not use `system_prompt`, and does not integrate memory. Meanwhile `AgentService.update_mood` accepts `recent_history` but hardcodes the result to "Optimistic" - completely defeating its purpose. `ProductivityService` uses all-static methods while every other service uses instance methods, making it impossible to inject or mock.

**Your job is to:**

1. **Merge the two streaming paths** into a single `_stream_agent_response(agents, user_message, user_id, room_id=None)` private method that:
   - Uses CrewAI for all paths (not raw OpenAI)
   - Saves messages for all paths
   - Handles the single-agent case without a room
2. **Fix `update_mood`** to actually call an LLM: use `chat_completion` with a short prompt like "Classify the mood of this conversation in one word: {recent_history}" and store the result
3. **Convert `ProductivityService` to an instance-based class** with `__init__(self)` so it can be injected via `Depends` like all other services
4. **Remove the `user_id` field from `AgentResponse`** — agents have a user_id in the DB but it shouldn't be returned in API responses (leaks ownership info unnecessarily)

**Next steps (prioritized for tomorrow):**

1. Refactor `stream_responses` to delegate to `stream_room_responses` with `room_id=None`, OR extract common logic into `_run_agent_pipeline(agents, message, user_id)`
2. Fix `update_mood` to call `chat_completion` with a mood classification prompt
3. Change `ProductivityService` to a proper class with `__init__(self)` and update `dependencies.py` to `get_productivity_service`
4. Add `ProductivityService` to `dependencies.py` and update all productivity routes to inject via `Depends`
5. Remove `user_id` from `AgentResponse` Pydantic schema (`agents/models.py:237`)

---

## TASK AUDIT-005

**TASK ID:** AUDIT-005
**PRIORITY:** 🟡 Important
**DOMAIN:** New Features — Agent Templates & Persona Discovery

You are a product engineer building consumer AI apps.

You have been given the following codebase to review:
- `backend/app/domain/agents/models.py`
- `backend/app/api/v1/agents.py`
- `backend/app/domain/agents/service.py`
- `frontend/lib/features/agents/pages/agents_page.dart`
- `frontend/lib/features/rooms/widgets/create_persona_sheet.dart`

Here is the full content of each file:

**backend/app/domain/agents/models.py** (AgentTemplate excerpt)
```python
class AgentTemplate(SupabaseModel):
    """Template for creating new agents."""
    id: UUID
    name: str
    description: str
    personality: str
    goals: list[str]
    capabilities: ManyToManyRelation[Capability]
    created_at: datetime

    class Meta:
        table = "agent_templates"
        sql_policies = [
            "CREATE POLICY agent_templates_select_all ON public.agent_templates FOR SELECT USING (true);"
        ]
```

**Database seed data (from migration):**
```sql
INSERT INTO public.agent_templates (id, name, description, personality, goals) VALUES
(gen_random_uuid(), 'The Librarian', 'A master of organization and archival data.',
 'You are calm, meticulous, and obsessed with metadata. You speak formally and value precision.',
 '["Catalog personal memories accurately", "Assist in finding old information", "Suggest logical groupings for data"]');
```

**backend/app/api/v1/agents.py** — current endpoints:
```python
@router.post("")   # create
@router.get("")    # list
@router.get("/capabilities")
@router.get("/integrations")
@router.post("/generate")  # AI generation from keywords
# NO endpoint for templates
```

**Background:** `AgentTemplate` is defined in the ORM, seeded in the database, and has RLS policies — but there is no API endpoint to list or use templates. The only way to create an agent is manually via `POST /agents` or via AI generation (`POST /agents/generate`). This leaves a major UX gap: new users with no context have no starting point. The frontend has an AI-generate flow but no template browsing experience.

**Your job is to implement the Agent Templates feature end-to-end:**

1. **Backend:** Add `GET /api/v1/agents/templates` endpoint that lists all available templates (returns `AgentTemplateResponse` list)
2. **Backend:** Add `POST /api/v1/agents/from-template/{template_id}` endpoint that creates an agent from a template, allowing the user to override name
3. **Backend:** Add `AgentService.list_templates()` and `AgentService.create_from_template(template_id, user_id, name_override=None)` methods
4. **Backend:** Add `AgentTemplateResponse` Pydantic schema to `agents/models.py`
5. **Frontend:** Add a "Browse Templates" section in the agent creation flow
6. **Seed more templates** in a new migration: at least 5 diverse templates (e.g., "The Coach", "The Researcher", "The Creative", "The Analyst", "The Companion")

**Next steps (prioritized for tomorrow):**

1. Add `AgentTemplateResponse` schema to `backend/app/domain/agents/models.py`
2. Add `list_templates()` method to `AgentRepository`
3. Add `list_templates()` and `create_from_template()` to `AgentService`
4. Add `GET /agents/templates` and `POST /agents/from-template/{template_id}` to `backend/app/api/v1/agents.py`
5. Create a Supabase migration with 5 new seed templates
6. Add `getAgentTemplates()` method to `frontend/lib/core/api/api_service.dart`

---

## TASK AUDIT-006

**TASK ID:** AUDIT-006
**PRIORITY:** 🟡 Important
**DOMAIN:** Performance — N+1 Queries & Missing Atomic Operations

You are a backend performance engineer.

You have been given the following codebase to review:
- `backend/app/infrastructure/repositories/agent_repo.py`
- `backend/app/domain/agents/service.py`
- `backend/app/infrastructure/external/openrouter.py`
- `backend/app/domain/memory/service.py`
- `backend/app/infrastructure/repositories/memory_repo.py`

Here is the full content of each file:

**backend/app/infrastructure/repositories/agent_repo.py**
```python
async def increment_message_count(self, agent_id: UUID | str) -> None:
    """Increment an agent's message count."""
    agent = await self.get_by_id(agent_id)  # ← full SELECT with prefetch_related
    if agent:
        agent.message_count += 1
        await agent.save()  # ← full UPDATE all fields
```

**backend/app/infrastructure/external/openrouter.py**
```python
# Singleton client — NOT thread-safe
_client: OpenRouterClient | None = None

def get_openrouter_client() -> OpenRouterClient:
    global _client
    if _client is None:
        _client = OpenRouterClient(get_settings().openrouter_api_key)
    return _client
```

**backend/app/domain/memory/service.py** (retrieve_memories)
```python
async def retrieve_memories(self, query: str, ...) -> list[Memory]:
    vector = await embed(query) if query else [0.0] * 1536
    # embed() makes a round-trip HTTP call to OpenRouter for every single message
    return await self.repo.match_memories(vector, 0.0, 5, ...)
```

**Background:** Several patterns in the codebase will cause performance degradation at scale: (1) `increment_message_count` fetches the full agent row (with joined capability/integration prefetches) just to increment an integer — should be a single `UPDATE agents SET message_count = message_count + 1 WHERE id = $1`; (2) the global `_client` singleton uses a simple `None` check that is not thread-safe in an async context (two concurrent requests can both pass the `None` check before either sets `_client`); (3) every chat request embeds the user's message via an external HTTP call — there's no caching or batching; (4) `list_all_memories` has a hardcoded `limit=100` with no pagination exposed via the API.

**Your job is to:**

1. **Fix `increment_message_count`** to use a raw SQL atomic update: `UPDATE agents SET message_count = message_count + 1 WHERE id = $1` via Tortoise's `execute_query`
2. **Fix the singleton race condition** in `openrouter.py`: use `asyncio.Lock` to guard initialization, or better, use `functools.cached_property` / module-level initialization
3. **Add embedding caching**: use an LRU cache with a short TTL (5 minutes) for recently embedded strings to avoid re-embedding the same queries
4. **Fix `list_all_memories`**: expose `limit` and `offset` parameters through the API endpoint and default to a more reasonable 50
5. **Add database connection pool settings** to `TORTOISE_ORM` config in `tortoise.py`

**Next steps (prioritized for tomorrow):**

1. Replace `increment_message_count` body with `await conn.execute_query("UPDATE agents SET message_count = message_count + 1 WHERE id = $1", [str(agent_id)])`
2. Add `_client_lock = asyncio.Lock()` in `openrouter.py` and guard `get_openrouter_client()` with `async with _client_lock:`
3. Add `@functools.lru_cache(maxsize=256)` on a synchronous wrapper around `embed()` with TTL invalidation
4. Add `limit: int = 50, offset: int = 0` params to `GET /memory` endpoint
5. Add `max_connections: 10, min_connections: 1` to Tortoise ORM config

---

## TASK AUDIT-007

**TASK ID:** AUDIT-007
**PRIORITY:** 🟡 Important
**DOMAIN:** New Features — Real-time Chat History & Conversation Context

You are a product engineer specializing in conversational AI.

You have been given the following codebase to review:
- `backend/app/domain/chat/service.py`
- `backend/app/infrastructure/repositories/chat_repo.py`
- `backend/app/domain/chat/models.py`
- `frontend/lib/features/rooms/pages/group_chat_page.dart`
- `frontend/lib/core/api/api_service.dart`

Here is the full content of each file:

**backend/app/domain/chat/service.py** (stream_room_responses)
```python
async def stream_room_responses(self, room_id: UUID, user_message: str, user_id: UUID) -> AsyncIterator[str]:
    """The core agentic chat loop using CrewAI."""
    user_msg = ChatMessage(room_id=room_id, user_id=user_id, content=user_message)
    await self.chat_repo.save_message(user_msg)

    db_agents = await self.chat_repo.list_room_agents(room_id)

    llm = self._get_crew_llm()
    # Task is created with ONLY the current user_message — no conversation history
    task = Task(
        description=(
            f"User said: {user_message}. "
            "Orchestrate a helpful conversation among available agents to assist the user."
        ),
        expected_output="A collaborative response from the most relevant agents.",
        agent=crew_agents[0],
    )
    # No prior conversation history is injected into the CrewAI task
```

**backend/app/infrastructure/repositories/chat_repo.py**
```python
async def get_room_messages(self, room_id: UUID) -> list[ChatMessage]:
    """Fetch all messages in a room."""
    return await ChatMessage.filter(room_id=room_id).order_by("created_at").all()
    # No pagination, no limit — returns ALL messages ever
```

**Background:** The CrewAI task in `stream_room_responses` receives only the current user message with no conversation history. The agent has no awareness of what was said in prior turns within the same room — each message is treated as a fresh, standalone request. This means agents cannot reference "what we discussed earlier" or maintain conversational continuity. The `chat_repo.get_room_messages` also has no pagination, potentially returning thousands of rows.

**Your job is to:**

1. **Inject recent conversation history** into the CrewAI task description: fetch the last N (e.g., 10) messages from the room before building the task, format them as a `[CONVERSATION HISTORY]` section, prepend to the task description
2. **Add a sliding window** so history doesn't grow unbounded — keep the most recent 10 turns
3. **Add pagination to `get_room_messages`**: add `limit: int = 50, offset: int = 0` parameters and expose via the API
4. **Add a `GET /rooms/{room_id}/messages?before_id={uuid}` cursor-based pagination** option for infinite scroll in the frontend
5. **Handle the `stream_responses` non-room path**: add conversation history support via the `ChatRoom` concept or a temporary in-memory session

**Next steps (prioritized for tomorrow):**

1. In `chat_repo.py`, add `get_recent_messages(room_id, limit=10) -> list[ChatMessage]` method
2. In `stream_room_responses`, call `recent = await self.chat_repo.get_recent_messages(room_id, limit=10)` before building the task
3. Format history as: `"\n".join([f"{'User' if m.user_id else 'Agent'}: {m.content}" for m in recent])`
4. Prepend to task description: `f"[CONVERSATION HISTORY]\n{history}\n\n[CURRENT MESSAGE]\n{user_message}"`
5. Add `limit` param to `get_room_messages` in `chat_repo.py` and the API endpoint

---

## TASK AUDIT-008

**TASK ID:** AUDIT-008
**PRIORITY:** 🟡 Important
**DOMAIN:** Refactoring — Steam Tool async/sync Bridge Hack

You are a senior Python engineer focused on async architecture.

You have been given the following codebase to review:
- `backend/app/infrastructure/external/steam_tool.py`
- `backend/app/infrastructure/external/steam.py`
- `backend/app/domain/chat/service.py`
- `backend/pyproject.toml`

Here is the full content of each file:

**backend/app/infrastructure/external/steam_tool.py**
```python
class SteamPlayerSummaryTool(BaseTool):
    def _run(self) -> str:
        """Run the tool synchronously."""
        try:
            asyncio.get_running_loop()
            import nest_asyncio
            nest_asyncio.apply()  # ← patches the event loop globally
        except RuntimeError:
            pass
        return asyncio.run(self._arun())  # ← runs async inside async via nest_asyncio

    async def _arun(self) -> str:
        # Actual async implementation
        summaries = await get_player_summaries([self.steam_id])
        ...
```

**Background:** CrewAI's `BaseTool` calls `_run` synchronously from within an already-running async event loop (FastAPI's). The current workaround uses `nest_asyncio.apply()` which globally patches the asyncio event loop to allow nested `asyncio.run()` calls. This is fragile, affects the entire process, can cause deadlocks, and is explicitly listed as a hack by the `nest-asyncio` package itself. CrewAI 1.x supports async tools via `_arun`.

**Your job is to:**

1. **Remove the `nest_asyncio` hack** entirely from both tools
2. **Convert both tools to pure async** by overriding `_arun` only and removing `_run` (CrewAI will handle the sync-to-async bridge correctly)
3. **Remove `nest-asyncio` from `pyproject.toml`** dependencies
4. **Verify all other `BaseTool` subclasses** in `productivity_tools.py` are already async-only (`_run` not defined there) — they are, confirm this
5. **Add a test** that imports the tool and calls `_arun` directly in a pytest-asyncio context

**Next steps (prioritized for tomorrow):**

1. Delete `_run` methods from `SteamPlayerSummaryTool` and `SteamOwnedGamesTool` in `steam_tool.py`
2. Remove `import nest_asyncio` and `nest_asyncio.apply()` calls
3. Remove `nest-asyncio` from `pyproject.toml` dependencies section
4. Run `uv lock` to update the lockfile
5. Verify `test_steam_tool.py` passes with the new pure-async implementation

---

## TASK AUDIT-009

**TASK ID:** AUDIT-009
**PRIORITY:** 🟡 Important
**DOMAIN:** Testing — Critical Missing Coverage

You are a senior QA engineer and test architect.

You have been given the following codebase to review:
- `backend/tests/conftest.py`
- `backend/tests/test_chat_service.py`
- `backend/tests/test_memory_graph.py`
- `backend/tests/test_repositories.py`
- `backend/app/domain/chat/service.py`
- `backend/app/domain/memory/service.py`
- `backend/app/domain/agents/service.py`
- `backend/app/api/v1/auth.py`

Here is the full content of each file:

**backend/app/domain/agents/service.py** (untested logic)
```python
async def update_mood(self, agent_id: UUID | str, recent_history: str) -> None:
    """Analyze history and update agent mood via repository."""
    if not recent_history.strip():
        return
    await self.repo.update_mood(agent_id, "Optimistic")  # ← hardcoded, no logic to test

async def generate_agent_profile(self, keywords: str) -> AgentGenerationResponse:
    """Use Instructor to generate a validated agent profile."""
    # Uses structured_completion — external call, needs mocking
    return await structured_completion(messages=..., response_model=AgentGenerationResponse)
```

**Backend test infrastructure from conftest.py:**
- Tests use an in-memory SQLite database
- External calls (OpenRouter, Steam) are mocked
- `pytest-asyncio` with `asyncio_mode = "strict"`

**Background:** The test suite has good breadth but several critical paths have no coverage: (1) the passkey auth endpoints return stubs, and no tests verify the stub behavior or will catch when the stubs are replaced with real code; (2) `generate_agent_profile` makes an external AI call that is likely not tested in CI; (3) `ChatService.stream_responses` (the main chat path) has no streaming tests; (4) the memory deduplication logic (`DEDUP_THRESHOLD = 0.97`) has no unit test that verifies two similar strings are deduplicated.

**Your job is to write the missing test cases:**

1. **Auth stub tests**: Test that all 4 passkey endpoints return expected shapes (will serve as regression tests when real auth is implemented)
2. **`stream_responses` streaming test**: Mock the OpenRouter client, call `stream_responses`, collect all yielded chunks, assert the final chunk is `"[[STATUS:done]]\n"`
3. **Memory deduplication test**: Create two memories with near-identical embeddings (cosine similarity > 0.97), verify the second `store_memory` call returns `None` (deduplicated)
4. **`generate_agent_profile` test**: Mock `structured_completion`, verify the returned `AgentGenerationResponse` has required fields
5. **Productivity CRUD tests**: Test create/read/update/delete for `Task`, `Note`, and `CalendarEvent` with timezone-aware datetimes
6. **Room authorization test**: Verify that user A cannot access user B's room messages (RLS enforcement)

**Next steps (prioritized for tomorrow):**

1. Add `test_auth_stubs.py` with 4 tests covering each passkey endpoint shape
2. Add `test_stream_responses` to `test_chat_service.py` using `AsyncMock` for the OpenRouter client
3. Add `test_memory_deduplication` to `test_memory_graph.py` with a mock `embed` function returning similar vectors
4. Add `test_generate_agent_profile` to `test_agents_routes.py` with mocked `structured_completion`
5. Expand `test_productivity.py` with full CRUD coverage including timezone-aware datetimes

---

## TASK AUDIT-010

**TASK ID:** AUDIT-010
**PRIORITY:** 🟢 Nice-to-have
**DOMAIN:** Dependencies — Dual LLM Abstraction & Stale Packages

You are a platform engineer responsible for dependency hygiene.

You have been given the following codebase to review:
- `backend/pyproject.toml`
- `backend/app/infrastructure/external/openrouter.py`
- `backend/app/domain/chat/service.py`

Here is the full content of each file:

**backend/pyproject.toml** (relevant deps)
```toml
dependencies = [
    "openrouter>=0.7.11",       # custom openrouter package
    "crewai[tools]>=1.10.1",    # uses litellm internally
    "litellm>=1.82.1",          # also listed as direct dep
    "instructor>=1.7.0",        # structured completions
    ...
]
```

**backend/app/infrastructure/external/openrouter.py**
```python
class OpenRouterClient:
    def __init__(self, api_key: str):
        import instructor
        from openai import AsyncOpenAI

        self.openai_client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            ...
        )
        # Uses openai package (via AsyncOpenAI) rather than the openrouter package
```

**backend/app/domain/chat/service.py**
```python
from app.infrastructure.external.openrouter import get_openrouter_client
# AND
from crewai import LLM  # which uses litellm internally
# AND the _OpenRouterLLM uses:
return _OpenRouterLLM(
    model=f"openrouter/{settings.default_chat_model}",
    base_url="https://openrouter.ai/api/v1",
    ...
)
```

**Background:** There are three overlapping LLM abstraction layers in use simultaneously: (1) the custom `OpenRouterClient` wrapping `AsyncOpenAI` with the OpenRouter base URL — used for embeddings and direct completions; (2) `litellm` — a dependency of CrewAI that also makes OpenRouter calls via `litellm.completion()`; (3) the `openrouter` package (`>=0.7.11`) — listed as a dependency but **never imported anywhere in the codebase**. This creates unnecessary complexity, increases the attack surface, and makes it hard to track which LLM calls use which library.

**Your job is to:**

1. **Audit every import of `openrouter`, `litellm`, and `openai`** across the codebase — map which files use which
2. **Remove the unused `openrouter` package** from `pyproject.toml` (it's never imported)
3. **Evaluate consolidating to `litellm`** as the single LLM abstraction: `litellm` already supports OpenRouter, embeddings, and streaming — the custom `OpenRouterClient` wrapping `AsyncOpenAI` could be replaced with `litellm.aembedding()` and `litellm.acompletion()`
4. **Document the decision** in an `AGENTS.md` update: which LLM library to use for what, and why
5. **Remove `litellm` as a direct dependency** if it's only needed transitively through CrewAI

**Next steps (prioritized for tomorrow):**

1. `grep -r "import openrouter\|from openrouter" backend/` — confirm it's never used
2. Remove `"openrouter>=0.7.11"` from `pyproject.toml` and run `uv lock`
3. Confirm `litellm` is only used transitively (check for direct imports)
4. If consolidating: replace `OpenRouterClient.embed()` with `litellm.aembedding()` and update `openrouter.py`
5. Update `AGENTS.md` with LLM library decision record

---

## TASK AUDIT-011

**TASK ID:** AUDIT-011
**PRIORITY:** 🟢 Nice-to-have
**DOMAIN:** New Features — Productivity Agent Integration & Calendar Sync

You are a product engineer building AI productivity tools.

You have been given the following codebase to review:
- `backend/app/domain/productivity/service.py`
- `backend/app/domain/productivity/models.py`
- `backend/app/domain/agent_tools/productivity_tools.py`
- `backend/app/api/v1/productivity.py`
- `frontend/lib/features/productivity/pages/action_page.dart`
- `frontend/lib/features/productivity/pages/tasks_page.dart`
- `frontend/lib/features/productivity/pages/notes_page.dart`

Here is the full content of each file:

**backend/app/domain/productivity/models.py** (CalendarEvent excerpt)
```python
class CalendarEvent(SupabaseModel):
    id: UUID
    user_id: UUID
    agent_id: UUID | None    # which agent created this event
    origin_message_id: UUID | None  # which chat message triggered creation
    origin_context: str | None  # why the agent created it
    title: str
    description: str | None
    start_time: datetime
    end_time: datetime
    is_all_day: bool
    location: str | None
```

**Background:** The productivity system (Tasks, Notes, Calendar Events) is fully implemented on the backend with agent tools. However: (1) there is no external calendar sync (iCal export, Google Calendar integration); (2) the `origin_message_id` and `origin_context` fields that link productivity items back to their creating chat message are captured but never surfaced in the UI — users can't see WHY an agent created a task; (3) the `action_page.dart` in the frontend likely doesn't show agent-created items differently from user-created items.

**Your job is to:**

1. **Add iCal export endpoint**: `GET /api/v1/productivity/calendar/export.ics` that returns all user events in iCal format (use the `icalendar` Python package)
2. **Surface `origin_context` in the UI**: in the notes and tasks pages, show a "Created by {agent_name}" badge with the `origin_context` tooltip when `agent_id` is set
3. **Add a "Suggested by Agent" filter** to the tasks and notes lists
4. **Add `agent_id` filter to list endpoints**: `GET /productivity/tasks?agent_id={uuid}` and `GET /productivity/notes?agent_id={uuid}`
5. **Add timezone support**: the `CalendarEvent.start_time` and `end_time` fields use UTC but the frontend should display in user's local timezone from `profiles.timezone`

**Next steps (prioritized for tomorrow):**

1. Add `icalendar` to `pyproject.toml` dependencies
2. Create `GET /api/v1/productivity/calendar/export.ics` endpoint in `productivity.py`
3. Implement `ProductivityService.export_ical(user_id) -> bytes` method
4. Add `agent_id: UUID | None = None` query param to `list_tasks` and `list_notes` endpoints
5. In Flutter, add an "Agent" chip/badge to task and note items where `agent_id` is not null

---

## TASK AUDIT-012

**TASK ID:** AUDIT-012
**PRIORITY:** 🟢 Nice-to-have
**DOMAIN:** Architecture — Frontend State Management Inconsistency

You are a Flutter architect with deep Riverpod experience.

You have been given the following codebase to review:
- `frontend/lib/main.dart`
- `frontend/lib/core/api/api_service.dart`
- `frontend/lib/features/rooms/pages/group_chat_page.dart`
- `frontend/lib/features/productivity/pages/tasks_page.dart`
- `frontend/pubspec.yaml`

Here is the full content of each file:

**frontend/pubspec.yaml** (relevant deps)
```yaml
dependencies:
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.6.1
  freezed_annotation: ^2.4.4
  json_annotation: ^4.9.0

dev_dependencies:
  build_runner: ^2.4.13
  freezed: ^2.5.7
  json_serializable: ^6.9.0
  riverpod_generator: ^2.6.3
```

**frontend/lib/core/api/api_service.dart**
```dart
class ApiService {
  // Entirely static methods — cannot be injected, cannot be mocked
  static String get baseUrl => BackendService.baseUrl.value;
  static Future<List<Agent>> getAgents() async { ... }
  static Stream<String> streamRoomChat(...) async* { ... }
  // ...
}
```

**frontend/lib/features/rooms/pages/group_chat_page.dart**
```dart
class _GroupChatPageState extends State<GroupChatPage> {
  List<ChatMessage> _messages = [];
  List<Agent> _roomAgents = [];
  bool _isLoading = true;
  bool _isSending = false;
  // All state is local StatefulWidget state
  // Direct calls to ApiService.* (static) — no Riverpod providers
```

**Background:** The Flutter frontend declares Riverpod (`flutter_riverpod`, `riverpod_generator`) and code generation tools (`freezed`, `json_serializable`) as dependencies — but examining the actual pages, **no Riverpod providers are actually used**. All state is managed via `StatefulWidget` with local `setState`, and API calls go directly to static `ApiService` methods. The `riverpod_annotation`, `freezed_annotation`, and `json_annotation` packages are declared but appear to have no generated files in use. This means the team is paying the complexity cost of these dependencies without any benefit.

**Your job is to:**

1. **Audit all `.dart` files** for `@riverpod`, `@freezed`, `@JsonSerializable` annotations — if none found, confirm these are dead dependencies
2. **Decide: commit or remove**: either (a) migrate key pages to proper Riverpod providers, or (b) remove the unused packages
3. **If migrating**: Design a `RoomsNotifier` and `ChatNotifier` using `@riverpod` that hold room list and message state, replacing the `StatefulWidget` local state
4. **If removing**: Remove `flutter_riverpod`, `riverpod_annotation`, `riverpod_generator`, `freezed`, `freezed_annotation`, `json_annotation`, `json_serializable`, `build_runner` from `pubspec.yaml` and use plain `StatefulWidget` + `ChangeNotifier`
5. **Convert `ApiService` from static to injectable**: Create `ApiServiceProvider` using Riverpod so API calls can be mocked in widget tests

**Next steps (prioritized for tomorrow):**

1. `grep -r "@riverpod\|@Riverpod\|@freezed\|@JsonSerializable" frontend/lib/` — confirm if annotations are used
2. Based on result: either start `RoomsNotifier` migration or remove unused packages
3. Convert `ApiService` to a non-static class with a constructor that accepts `baseUrl` and `token`
4. Create `apiServiceProvider` using `Provider<ApiService>(...)`
5. Update `group_chat_page.dart` to use `ref.watch(apiServiceProvider)` instead of `ApiService.*()`

---

## MANIFEST

```
Total tasks:        12
Domains covered:    Architecture, New Features, Refactoring, Security, Performance, Testing, Dependencies
Primary focus:      Architecture, New Features, Security
Files reviewed:     48
Tasks with dependencies: none (all tasks are fully independent)
```

### Task Summary

| ID | Priority | Domain | Key Finding |
|----|----------|--------|-------------|
| AUDIT-001 | 🔴 Critical | Architecture | Memory is NEVER injected into chat — core value prop is broken |
| AUDIT-002 | 🔴 Critical | New Features | Knowledge graph, affinity scoring, action logs are all modeled but empty |
| AUDIT-003 | 🔴 Critical | Security | WebAuthn returns dummy tokens — live auth bypass in production |
| AUDIT-004 | 🟡 Important | Refactoring | Two divergent chat paths, hardcoded mood, static ProductivityService |
| AUDIT-005 | 🟡 Important | New Features | AgentTemplate model + seed data exists but no API endpoint |
| AUDIT-006 | 🟡 Important | Performance | N+1 fetch-then-save, non-thread-safe singleton, no embedding cache |
| AUDIT-007 | 🟡 Important | New Features | No conversation history injected into CrewAI — agents are amnesiac per-turn |
| AUDIT-008 | 🟡 Important | Refactoring | nest_asyncio global event loop patch — fragile async/sync bridge |
| AUDIT-009 | 🟡 Important | Testing | Missing streaming tests, dedup tests, auth regression tests |
| AUDIT-010 | 🟢 Nice-to-have | Dependencies | Three overlapping LLM libraries; `openrouter` package imported nowhere |
| AUDIT-011 | 🟢 Nice-to-have | New Features | No iCal export, origin_context not surfaced in UI |
| AUDIT-012 | 🟢 Nice-to-have | Architecture | Riverpod declared but unused; ApiService is all-static (untestable) |
