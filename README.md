# Miru - AI Personal Assistant with Memory

**Miru** is a personal AI assistant that actually remembers you. Unlike typical chatbots that start fresh every conversation, Miru uses vector memory powered by Supabase (PostgreSQL + pgvector) to store and retrieve your past interactions, creating a truly personalized experience that grows smarter over time.

## What Miru Does

### Core Features

**Long-term Memory**
- Every conversation is stored as a vector embedding in pgvector
- Automatically retrieves relevant memories based on cosine similarity (HNSW-indexed)
- Remembers facts, preferences, and past discussions
- Memory collections for grouping related memories
- Knowledge graph with entities and relationships stored in PostgreSQL

**AI-Powered Agents**
- Create custom AI personas with unique personalities, goals, and capabilities
- AI-assisted agent generation from keywords
- Agent templates for quick setup
- Extensible tool system (web search, productivity tools, Steam integration)
- Multi-agent orchestration via CrewAI

**Chat Rooms & Group Chat**
- Solo chat with any agent using streaming responses
- Multi-agent group chat rooms
- Context-aware replies that reference your history

**Productivity Suite**
- Tasks with completion tracking
- Notes with pinning and agent-created notes
- Calendar events with all-day support and location

**Authentication**
- Magic link (email)
- Password login
- Passwordless passkey/WebAuthn support

**Multi-Platform**
- iOS
- Android
- Web (Azure Static Web Apps)
- macOS, Windows, Linux (Flutter desktop)

### Use Cases

- **Personal Journal** - Reflect on past thoughts and track personal growth
- **Learning Companion** - Remember what you're studying and build on it
- **Task Management** - Manage tasks, notes, and calendar events conversationally
- **Creative Writing** - Maintain continuity across writing sessions
- **Knowledge Base** - Store and retrieve information conversationally
- **Multi-Agent Collaboration** - Orchestrate multiple AI personas for complex tasks

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                            MIRU                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐    ┌───────────────────────────┐  │
│  │  Frontend (Flutter)      │    │  Backend (FastAPI)        │  │
│  │  ├─ iOS / Android        │◄──►│  ├─ REST API (/api/v1)   │  │
│  │  ├─ Web                  │    │  ├─ Streaming (SSE)       │  │
│  │  └─ Desktop (mac/win/lnx)│    │  ├─ Vector Search         │  │
│  │                          │    │  ├─ CrewAI Orchestration   │  │
│  │  State: Riverpod +       │    │  └─ Agent Tool System     │  │
│  │         StatefulWidget   │    │                           │  │
│  │  Models: Freezed         │    │  Supabase (PostgreSQL     │  │
│  └──────────────────────────┘    │    + pgvector)            │  │
│                                  └───────────────────────────┘  │
│                                                                  │
│  External Services:                                              │
│  • OpenRouter — LLM & embeddings (Claude, GPT, etc.)            │
│  • Supabase — Auth, database, RLS                                │
│  • Azure — Container Apps, Static Web Apps, Notification Hubs    │
│  • Sentry — Error tracking                                       │
│  • Tavily — Web search for agents                                │
│  • Steam Web API — Gaming integration                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User sends message** -> Frontend sends request to `/api/v1/rooms/{id}/messages`
2. **Memory retrieval** -> Backend embeds the query via OpenRouter, searches pgvector for similar memories
3. **Context injection** -> Relevant memories are injected into the agent's system prompt
4. **Streaming response** -> Agent generates a response streamed back via SSE
5. **Memory storage** -> The conversation is embedded and stored for future retrieval

## Quick Start

### Prerequisites

- **Python 3.13+** - Backend runtime
- **Flutter SDK 3.11+** - Frontend framework
- **Docker & Docker Compose** - Local development database
- **Make** - Build automation
- **Supabase account** - Database and auth ([supabase.com](https://supabase.com))
- **OpenRouter API key** - LLM access ([openrouter.ai](https://openrouter.ai))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/miru.git
cd miru

# Setup Python virtual environment and install dependencies
make setup-backend

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env — see the .env.example for required keys

# Start local PostgreSQL database with pgvector (optional, for local dev)
make db

# Run backend server (Terminal 1)
make backend

# Run Flutter frontend (Terminal 2)
cd frontend && flutter pub get
make frontend
```

### Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for LLM and embeddings |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (backend only) |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret for token validation |
| `DATABASE_URL` | Yes | Direct PostgreSQL connection string |
| `WEBAUTHN_RP_ID` | Yes | Passkey relying party ID (`localhost` for dev) |
| `TAVILY_API_KEY` | No | Tavily API key for agent web search |

## Project Structure

```
miru/
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── main.py              # Entry point, lifespan, CORS, Sentry, router mounts
│   │   ├── core/
│   │   │   ├── config.py        # pydantic-settings configuration
│   │   │   └── security/auth.py # Supabase JWT validation, get_current_user()
│   │   ├── domain/              # Bounded contexts
│   │   │   ├── agents/          # Agent models, service, schemas
│   │   │   ├── auth/            # Profile, Passkey models, service
│   │   │   ├── chat/            # ChatRoom, ChatMessage, streaming
│   │   │   ├── memory/          # Memory, graph nodes/edges, embeddings
│   │   │   ├── productivity/    # Tasks, Notes, Calendar Events
│   │   │   ├── notifications/   # Push notification service
│   │   │   └── agent_tools/     # Extensible agent tool system
│   │   ├── api/v1/              # Route handlers per domain
│   │   └── infrastructure/      # Database, external services, repositories
│   │       ├── database/        # Supabase client, Tortoise ORM config
│   │       ├── external/        # OpenRouter, Steam, CrewAI
│   │       └── repositories/    # Data access layer
│   ├── tests/                   # Pytest test suite
│   ├── manage.py                # Migration CLI (makemigrations, check, migrate, status)
│   ├── Dockerfile
│   └── pyproject.toml
│
├── frontend/                    # Flutter multi-platform frontend
│   ├── lib/
│   │   ├── main.dart            # Entry point, ProviderScope, auth routing
│   │   ├── core/
│   │   │   ├── api/             # API service, agents service, productivity service
│   │   │   ├── design_system/   # Components, tokens, themes
│   │   │   ├── models/          # Freezed data models
│   │   │   └── services/        # Supabase, Passkey, Notification services
│   │   └── features/
│   │       ├── agents/          # Agent management pages
│   │       ├── auth/            # Login flows (magic link, password, passkey)
│   │       ├── chat/            # Solo chat interface
│   │       ├── rooms/           # Group chat rooms
│   │       ├── productivity/    # Tasks, Notes, Calendar Events
│   │       ├── onboarding/      # First-launch experience
│   │       └── settings/        # App configuration
│   ├── test/                    # Widget and unit tests
│   └── pubspec.yaml
│
├── supabase/
│   └── migrations/              # SQL migration files (source of truth for schema)
│
├── .github/workflows/           # CI/CD automation
├── docker-compose.yml           # Local dev: pgvector container
├── Makefile                     # Development commands
└── AGENTS.md                    # Guidelines for AI coding agents
```

## API

All routes are under `/api/v1` and require a Supabase JWT Bearer token (except health check).

| Prefix | Description |
|--------|-------------|
| `GET /health` | Health check |
| `/api/v1/agents` | Agent CRUD, AI generation, capabilities, integrations |
| `/api/v1/auth` | Passkey registration and login (WebAuthn) |
| `/api/v1/rooms` | Chat rooms, messages, streaming responses |
| `/api/v1/crew` | CrewAI multi-agent orchestration |
| `/api/v1/memory` | Memory storage and retrieval |
| `/api/v1/productivity` | Tasks, Notes, Calendar Events |
| `/api/v1/integrations` | Steam integration |
| `/api/v1/notifications` | Push notification registration |

Interactive API docs are available at `http://localhost:8000/docs` when the backend is running.

## CI/CD & Automation

### GitHub Actions Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `pr-checks.yml` | Pull requests | Backend tests + lint, Flutter tests + lint, security audit, PR size check |
| `backend-deploy.yml` | Push to main/develop | Test, Docker build to GHCR, Trivy scan, migrate DB, deploy to Azure Container Apps |
| `flutter-pipeline.yml` | Push to main/develop | Flutter CI, build APK/iOS/Web, Lighthouse test, deploy web to Azure Static Web Apps |
| `database-migrations.yml` | Push/PR touching migrations | Validate migration drift, deploy to staging/production via Supabase CLI |
| `release.yml` | Tag push (v*) | GitHub release with changelog, build artifacts, Sentry release |
| `codeql-analysis.yml` | Push/PR, weekly | Python security analysis |
| `nightly.yml` | Daily 2 AM UTC | Security audit, dependency check, multi-platform build test |
| `maintenance.yml` | Weekly/hourly | Label sync, artifact cleanup, branch cleanup, Sentry issue sync |
| `notify-failure.yml` | Workflow failure | Discord + Slack notifications, auto-create GitHub issues |
| `ai-agents.yml` | Issues, schedule | Jules auto-fix for Sentry issues, CodeRabbit bridge, performance reports |

### Required GitHub Secrets

**Azure Deployment:**
- `AZURE_CREDENTIALS`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
- `AZURE_STATIC_WEB_APPS_API_TOKEN`

**Supabase:**
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_PROJECT_REF_STAGING`

**Backend:**
- `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`, `DATABASE_URL`

**Quality & Monitoring:**
- `CODECOV_TOKEN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

**Notifications:**
- `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`

## Development

### Backend

```bash
cd backend

# Run server
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests with coverage
.venv/bin/pytest --cov=app --cov-report=term-missing

# Lint
ruff check . && black --check . && isort --check-only . && mypy app/

# Auto-fix
ruff check --fix . && black . && isort .
```

### Frontend

```bash
cd frontend

# Get dependencies and generate models
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# Run app
flutter run

# Run tests
flutter test --coverage

# Lint
flutter analyze
dart format --output=none --set-exit-if-changed .
```

### Make Commands

```bash
make setup-backend   # Create venv, install deps
make setup-hooks     # Install pre-commit hook
make db              # Start local pgvector Docker container
make db-stop         # Stop local Docker container
make backend         # Run FastAPI server
make frontend        # Run Flutter app
make test            # Run all tests
make lint            # Run all linting
make fix             # Auto-fix lint issues
make clean           # Remove build artifacts
```

### Database Migrations

Schema changes are code-first via Tortoise ORM models:

```bash
cd backend

# 1. Edit models in app/domain/**/models.py
# 2. Generate migration
python manage.py makemigrations <name>

# 3. Apply locally
supabase db reset --local

# 4. Check for uncommitted drift
python manage.py check
```

See [AGENTS.md](AGENTS.md) for full migration workflow details.

## Code Quality

- **Backend:** 75%+ test coverage, strict type hints, Google-style docstrings
- **Frontend:** 70%+ test coverage, Effective Dart style
- **Security:** CodeQL scanning, Trivy container scanning, dependency audits
- **Pre-commit hooks:** ruff, black, flutter analyze, dart format

Install hooks: `make setup-hooks`

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following our code style
4. Run tests: `make test`
5. Run linting: `make lint`
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
7. Push and create a Pull Request

## Security

See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities.

## License

[MIT License](LICENSE)

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [Flutter](https://flutter.dev/) - Multi-platform UI framework
- [Supabase](https://supabase.com/) - Auth, database, and real-time
- [OpenRouter](https://openrouter.ai/) - LLM routing and access
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search for PostgreSQL
- [CrewAI](https://www.crewai.com/) - Multi-agent orchestration
- [Sentry](https://sentry.io/) - Error tracking
- [Azure](https://azure.microsoft.com/) - Cloud hosting

---

<p align="center">Built with FastAPI + Flutter + Supabase</p>
