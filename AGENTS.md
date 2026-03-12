# AGENTS.md - Guidelines for AI Coding Agents

This document provides essential information for AI agents working on the Miru codebase.

## Project Overview

Miru is a personal AI assistant with a **FastAPI backend** (Python) and **Flutter frontend** (Dart). It uses Supabase (PostgreSQL + pgvector) as the primary database, Neo4j for memory graph relationships, and OpenRouter for LLM and embeddings.

**Key Technologies:**
- **Backend:** FastAPI, Supabase Python SDK, Neo4j, CrewAI, PyJWT, Sentry, webauthn
- **Frontend:** Flutter, Dart, supabase_flutter, credential_manager
- **AI:** OpenRouter (LLM + embeddings)
- **Database:** Supabase (PostgreSQL + pgvector), Neo4j

---

## Build / Test / Lint Commands

### Backend (Python)
```bash
cd backend

.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Run server
.venv/bin/pytest --cov=app --cov-report=term-missing                 # Run all tests
.venv/bin/pytest tests/test_specific.py::test_function_name -v       # Run single test
ruff check . && black --check . && isort --check-only . && mypy app/ # Lint
ruff check --fix . && black . && isort .                             # Auto-fix
```

### Frontend (Flutter/Dart)
```bash
cd frontend

flutter run                                                # Run app
flutter test --coverage                                    # Run all tests
flutter test test/widget_test.dart --name="test name"     # Run single test
flutter analyze                                           # Lint
dart format --output=none --set-exit-if-changed .         # Check formatting
dart format .                                             # Fix formatting
```

### Make Commands (Root)
```bash
make setup-backend   # Create venv, install deps
make setup-hooks     # Install pre-commit hook
make db              # Start local pgvector Docker container (dev only)
make db-stop         # Stop local Docker container
make test-backend    # Run backend tests
make test-frontend   # Run frontend tests
make test            # Run all tests
make lint-backend    # Lint backend
make lint-frontend   # Lint frontend
make lint            # Lint all
make fix-backend     # Auto-fix backend lint
make fix-frontend    # Auto-fix frontend lint
```

---

## Project Structure

```
backend/
  app/
    main.py          # FastAPI entry point, lifespan, CORS, router mounts
    config.py        # pydantic-settings Settings class, get_settings()
    database.py      # Supabase client singleton, get_supabase()
    routes.py        # ALL route handlers in one file (/chat, /memories, /agents, /rooms, etc.)
    auth.py          # Supabase JWT validation, get_current_user() dependency
    agents.py        # Agent/room/message models, DB ops, orchestration logic
    memory.py        # store_memory(), retrieve_memories() via Supabase RPC + Neo4j
    openrouter.py    # OpenRouter SDK: embed(), stream_chat(), chat_completion()
    crew.py          # CrewAI integration for research/planning/summarisation/general tasks
    graph.py         # Neo4j async driver, memory graph operations
    passkey.py       # WebAuthn passkey registration and authentication
    migrate.py       # Alembic CLI wrapper (not primary migration mechanism)
  sql/
    init.sql         # Local Docker dev schema init
  tests/
    conftest.py      # Fixtures: TestClient, auth helpers, make_jwt()
    test_agents.py
    test_agents_routes.py
    test_auth.py
    test_crew.py
    test_health.py
    test_memory.py
    test_openrouter.py
    test_passkey.py
  requirements.txt
  requirements-dev.txt
  pyproject.toml     # Tool config only (ruff, black, isort, mypy, pytest) — no [project] table
  .env.example
  Dockerfile

frontend/
  lib/
    main.dart              # Entry point — Supabase + BackendService init, auth stream routing
    main_scaffold.dart     # Bottom nav (Rooms + Settings), CreatePersona sheet
    auth_page.dart         # Magic link, password, and passkey login flows
    api_service.dart       # All backend HTTP calls as static methods
    backend_service.dart   # SharedPreferences-backed base URL, health poller
    chat_page.dart         # Solo chat with streaming
    rooms_page.dart        # Chat room listing
    group_chat_page.dart   # Multi-agent group chat with streaming
    agents_page.dart       # Agent creation and listing
    introduction_page.dart # Onboarding flow
    loading_page.dart      # Backend cold-start poller
    settings_page.dart     # Settings, sign-out, backend URL override
    models/
      agent.dart
      chat_message.dart
      chat_room.dart
      message_status.dart
    services/
      supabase_service.dart  # Supabase auth wrapper (magic link, password, passkey)
      passkey_service.dart   # WebAuthn credential_manager integration
    design_system/           # Custom design system (tokens, components, theme, extensions)
  test/
    widget_test.dart         # Design system widget tests
  integration_test/
    smoke_test.dart
  pubspec.yaml
  analysis_options.yaml

supabase/
  migrations/              # Source of truth for schema — raw SQL, run via Supabase CLI
    20260306000000_initial_schema.sql
    20260309000000_fix_memories_id_to_uuid.sql
    20260309200000_add_auth_and_passkeys.sql
    20260309300000_add_agents_and_groups.sql
    20260309400000_add_advanced_memories.sql

docker-compose.yml         # Local dev only: pgvector/pgvector:pg16 container
Makefile
```

---

## Architecture

### Backend

All application code lives in a **flat `app/` directory** — there are no `routes/`, `services/`, `repositories/`, or `models/` subdirectories. The key modules are:

- **`routes.py`** — All API route handlers in one file. Two routers are registered: the main `router` and `passkey_router`, both mounted under `/api` in `main.py`.
- **`agents.py`** — Contains both the Pydantic models for agents/rooms/messages and the database operations using the Supabase client directly. Also contains the multi-agent orchestration logic.
- **`memory.py`** — Stores and retrieves memories via Supabase RPC (`match_memories`) for vector similarity, and writes graph relationships to Neo4j.
- **`openrouter.py`** — All LLM and embedding calls go through here. Models are configurable via env vars (`EMBEDDING_MODEL`, `DEFAULT_CHAT_MODEL`).
- **`auth.py`** — JWT validation (supports HS256 and ES256/RS256 via JWKS). The `get_current_user()` FastAPI dependency is defined here.

### Frontend

The frontend is a **flat `lib/` directory** — there is no feature-based folder structure. State management uses **plain `StatefulWidget` + `setState`** throughout; there is no Riverpod, Provider, BLoC, or GetX. Routing is driven by a `StreamBuilder<AuthState>` and an `IndexedStack` — there is no go_router or named routes.

- **`api_service.dart`** — All HTTP calls to the backend as static methods using `package:http`. Attaches the Supabase JWT as a Bearer token.
- **`backend_service.dart`** — `ValueNotifier<String>` backed by `SharedPreferences` for the backend base URL. Also provides a `waitForBackend()` health poller for cold-start scenarios.
- **`services/supabase_service.dart`** — Wraps `supabase_flutter` for auth: magic link, password login, passkey session injection. Persists sessions via `FlutterSecureStorage` (mobile) or `SharedPreferences` (web).

### Database

**Supabase (primary):** Accessed via the Supabase Python SDK — not asyncpg directly. All queries use the fluent client API (`.table("x").select(...).eq(...).execute()`). Vector similarity search uses the `match_memories` Supabase RPC function. Row Level Security (RLS) is enabled on all tables. Schema is managed via raw SQL files in `supabase/migrations/`.

**Neo4j (graph layer):** Accessed via the async `neo4j` driver in `graph.py`. Stores `Memory` nodes and relationships (`RELATED_TO`, `SIMILAR_TO`). Failures are caught and logged — Neo4j being unavailable is non-fatal.

### API Design
- All routes are under `/api` (e.g., `/api/chat`, `/api/memories`, `/api/agents`)
- Use plural nouns for resources: `/memories`, `/agents`, `/rooms`
- Use nested routes for relationships: `/rooms/{id}/agents`, `/rooms/{id}/messages`
- Auth is enforced via the `get_current_user()` dependency on protected routes

---

## Code Style

### Python

- Line length: 100 characters
- Double quotes for strings, 4-space indentation
- Always include `from __future__ import annotations` at the top
- Use `Black` + `Ruff` for formatting; `isort` (Black profile) for imports
- Import order: stdlib → third-party → first-party (`app.*`)
- Type hints required on all function signatures
- Use `str | None` not `Optional[str]`; `list[str]` not `List[str]`
- Use Google-style docstrings on all public functions and classes
- Log errors with context; use `logger.exception()` for unexpected errors
- Raise `HTTPException` with appropriate status codes in route handlers
- Prefer specific exceptions over bare `except Exception`

**Naming:** `snake_case` functions/variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants, `_leading_underscore` for private

### Dart

- Line length: 80 characters
- Single quotes for strings, trailing commas on multi-line structures
- Import order: `dart:` → `package:` → relative
- Use `const` constructors wherever possible
- Use `final` for variables that don't reassign
- Use `Future<void>` not bare `Future`; `late final` over nullable when deferred
- All public APIs need explicit types
- Use `debugPrint` in development; `developer.log` for structured logging
- Always `rethrow` caught exceptions unless you're handling them fully

**Naming:** `PascalCase` classes, `camelCase` functions/variables/constants, `snake_case.dart` files, `_leadingUnderscore` private members

---

## Testing

### Requirements
- Backend: 75%+ coverage; 90%+ on critical paths
- Frontend: 70%+ coverage
- Run tests before committing
- Mock all external services (Supabase, OpenRouter, Neo4j, CrewAI) — never call real APIs in tests
- Write regression tests for every bug fix

### Backend
- Use `pytest` with `pytest-asyncio` (`asyncio_mode = "strict"`) for async tests
- Use fixtures in `conftest.py` for `TestClient`, auth headers, and JWT helpers
- Structure tests as Arrange / Act / Assert
- Use `unittest.mock.patch` to mock Supabase, OpenRouter, Neo4j, and CrewAI
- Test both the happy path and error/edge cases
- Route tests use `fastapi.testclient.TestClient` (synchronous)

### Frontend
- Use `flutter_test` and `mockito` for widget and unit tests
- Test user interactions (taps, inputs, scroll)
- Test loading states, error states, and empty states
- Mock `ApiService` static methods — never make real HTTP calls in tests
- Use `findsOneWidget` / `findsNothing` / `findsNWidgets` appropriately

---

## Security

- Never commit secrets — use `.env` (already in `.gitignore`)
- Validate all inputs via Pydantic models and `Field` constraints
- Use parameterized queries via the Supabase SDK — never string interpolation
- Validate Supabase JWTs in `auth.py` middleware; never re-validate in individual routes
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use it only in admin-only operations (passkey session minting)
- WebAuthn challenges are stored in-memory with a 5-minute TTL — do not persist them
- Never store tokens in plain text on the frontend (use `FlutterSecureStorage` on mobile)
- Clear auth state on logout via `SupabaseService`

---

## Performance

### Backend
- All I/O must be `async` — never block the event loop
- Paginate all list endpoints; never return unbounded result sets
- Neo4j failures must not block the request — wrap graph writes in try/except
- Use `ivfflat` index on `memories.embedding` for pgvector cosine similarity (already in migrations)
- Stream LLM responses via `stream_chat()` — do not buffer full responses in memory

### Frontend
- Use `const` widgets to prevent unnecessary rebuilds
- Use `ListView.builder` for long lists — never `Column` with many children
- Dispose listeners, controllers, and streams in `dispose()`
- Debounce search inputs
- Use `SharedPreferences` for chat history persistence — do not re-fetch on every render

---

## Error Handling

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Successful GET / PUT / PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Validation / bad request |
| 401 | Authentication required |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate) |
| 422 | Semantic / business logic error |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

### Rules
- Never expose raw exception messages to API consumers
- Always include a machine-readable `error` code alongside the message
- Frontend must never show raw API errors to users — map them to friendly messages
- Provide retry affordance in the UI wherever the operation is safe to retry

---

## Workflow

### Code Editing
- Never create temporary scripts or helper files for one-off tasks
- Always edit the existing codebase directly — no patches, no external tools
- Make incremental, focused changes; avoid batching unrelated modifications
- Follow existing patterns before introducing new ones

### Before Making Changes
1. Read the relevant existing code first
2. Run the tests to confirm the baseline is green
3. Identify any similar implementations to follow

### After Making Changes
1. Run the relevant tests
2. Run linting (`make lint`)
3. Review the diff for unintended side-effects
4. Confirm no secrets ended up in the changeset

---

## Git

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`
Scopes: `backend`, `frontend`, `api`, `db`, `ui`, `deps`

### Commit Rules
- Small, focused commits — one logical change per commit
- Explain *why*, not *what*, in the commit body
- Reference issue numbers in the footer (`Closes #123`)
- Never commit broken or untested code
- Never commit secrets

### Branch Naming
- `feature/description` — new features
- `bugfix/description` — bug fixes
- `hotfix/description` — urgent production fixes
- `refactor/description` — code cleanup
- `test/description` — test additions

---

## Environment Setup

Copy and populate the backend `.env`:
```bash
cp backend/.env.example backend/.env
```

Required variables:
```
OPENROUTER_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Miru
WEBAUTHN_EXPECTED_ORIGIN=http://localhost
CORS_ALLOWED_ORIGINS=*

# Optional — defaults are used if unset
# EMBEDDING_MODEL=openai/text-embedding-3-small
# DEFAULT_CHAT_MODEL=anthropic/claude-3.5-sonnet
```

---

## Pre-commit Hook

Runs automatically on `git commit`:
- `ruff check .`
- `black --check .`
- `flutter analyze`
- `dart format --output=none --set-exit-if-changed .`

Install with: `make setup-hooks`

---

## Common Tasks

### Adding a New API Endpoint
1. Add the route handler in `backend/app/routes.py`
2. Add any new Pydantic models inline or in the most relevant module (e.g., `agents.py`)
3. Add database logic directly using `get_supabase()` or existing helpers in `agents.py` / `memory.py`
4. Write tests in `backend/tests/`, mocking Supabase and any external services
5. Run `make test-backend` and `make lint-backend`

### Adding a New Flutter Screen
1. Create the new page file directly under `frontend/lib/` (e.g., `new_feature_page.dart`)
2. Add any new models to `frontend/lib/models/`
3. Add any new backend calls to `api_service.dart` as static methods
4. Wire navigation in `main.dart` or `main_scaffold.dart` using the existing `StreamBuilder`/`IndexedStack` pattern
5. Write widget tests in `frontend/test/`
6. Run `flutter test` and `flutter analyze`

### Adding a Database Migration
1. Create a new SQL file in `supabase/migrations/` with a timestamp prefix (`YYYYMMDDHHMMSS_description.sql`)
2. Include both `up` logic and any necessary `down` rollback
3. Apply via the Supabase CLI against your project
4. Update `sql/init.sql` if the change affects the local Docker dev schema

### Working with Vector Embeddings
1. Use `embed()` from `app/openrouter.py` to generate embeddings
2. Store via `store_memory()` in `app/memory.py`
3. Retrieve via `retrieve_memories()` which calls the `match_memories` Supabase RPC
4. The `ivfflat` index on `memories.embedding` is already defined in migrations — do not add duplicate indexes

---

## Getting Help

- Check existing code for similar patterns before writing new ones
- Read the tests to understand expected behaviour
- Run `make help` for available commands
- API docs available at `http://localhost:8000/docs` when the backend is running
