# Miru - AI Personal Assistant with Memory

**Miru** is a personal AI assistant that actually remembers you. Unlike typical chatbots that start fresh every conversation, Miru uses vector memory powered by PostgreSQL + pgvector to store and retrieve your past interactions, creating a truly personalized experience that grows smarter over time.

## 🎯 What Miru Does

### Core Features

**🧠 Long-term Memory**
- Every conversation you have is stored as a vector embedding
- Automatically retrieves relevant memories based on context similarity
- Remembers facts, preferences, and past discussions
- Memory persists across sessions and devices

**💬 Natural Conversations**
- Powered by Mistral AI's large language models
- Streaming responses for real-time interaction
- Context-aware replies that reference your history
- Warm, thoughtful personality

**📱 Multi-Platform Support**
- iOS (via TestFlight)
- Android
- Web (Azure Static Web Apps)
- Windows
- macOS
- Linux

### Use Cases

- **Personal Journal** - Reflect on past thoughts and track personal growth
- **Learning Companion** - Remember what you're studying and build on it
- **Task Management** - Recall previous projects and decisions
- **Creative Writing** - Maintain continuity across writing sessions
- **Knowledge Base** - Store and retrieve information conversationally

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          MIRU                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌──────────────────────────┐   │
│  │  Frontend (Flutter)     │    │  Backend (FastAPI)       │   │
│  │  ├─ iOS                 │◄──►│  ├─ REST API             │   │
│  │  ├─ Android             │    │  ├─ Streaming Responses  │   │
│  │  ├─ Web                 │    │  └─ Vector Search        │   │
│  │  ├─ Windows             │    │                          │   │
│  │  └─ Desktop (mac/Linux) │    │  PostgreSQL + pgvector   │   │
│  │                         │    │  └─ Embeddings storage   │   │
│  └─────────────────────────┘    └──────────────────────────┘   │
│                                                                 │
│  External Services:                                             │
│  • Mistral AI - Language models & embeddings                    │
│  • Azure - Hosting (Container Apps + Static Web Apps)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User sends message** → Frontend sends POST to `/chat`
2. **Memory retrieval** → Backend embeds query, searches pgvector for similar memories
3. **Context injection** → Relevant memories are injected into the AI's system prompt
4. **Streaming response** → AI generates response with memory context
5. **Memory storage** → User's message is embedded and stored for future retrieval

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** - Backend runtime
- **Flutter SDK 3.19+** - Frontend framework
- **Docker & Docker Compose** - Database and local development
- **Make** - Build automation
- **Mistral API Key** - Get one at [console.mistral.ai](https://console.mistral.ai)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/miru.git
cd miru

# Setup Python virtual environment and install dependencies
make setup-backend

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and add your MISTRAL_API_KEY

# Start PostgreSQL database with pgvector
make db

# Run backend server (Terminal 1)
make backend

# Run Flutter frontend (Terminal 2)
make frontend
```

### First Conversation

1. Open the app on your device or browser
2. Start typing in the chat interface
3. Tell Miru something about yourself (e.g., "My favorite color is blue")
4. Later, ask "What's my favorite color?" - Miru will remember!

## 📁 Project Structure

```
miru/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── main.py          # FastAPI application entry
│   │   ├── routes.py        # API endpoints (/chat, /memories)
│   │   ├── memory.py        # Vector embedding & retrieval logic
│   │   ├── database.py      # PostgreSQL connection pool
│   │   └── config.py        # Environment configuration
│   ├── sql/                 # Database migrations
│   │   └── init.sql         # pgvector schema setup
│   ├── tests/               # Pytest test suite
│   ├── Dockerfile           # Container image
│   └── pyproject.toml       # Python dependencies & tooling
│
├── frontend/                # Flutter multi-platform frontend
│   ├── lib/
│   │   ├── main.dart        # App entry point
│   │   ├── chat_page.dart   # Main chat interface
│   │   ├── api_service.dart # HTTP client for backend
│   │   └── design_system/   # UI components & themes
│   ├── test/                # Widget and integration tests
│   ├── ios/                 # iOS platform code
│   ├── android/             # Android platform code
│   ├── web/                 # Web platform configuration
│   └── pubspec.yaml         # Dart dependencies
│
├── .github/                 # GitHub configuration
│   ├── workflows/           # CI/CD automation
│   └── ISSUE_TEMPLATE/      # Contribution templates
│
├── docker-compose.yml       # Local development services
├── Makefile                 # Common development commands
└── AGENTS.md               # Guidelines for AI coding agents
```

## 🔧 API Endpoints

### `POST /chat`
Stream a chat response with memory context.

**Request:**
```json
{
  "message": "What's my favorite color?"
}
```

**Response:** (streaming text)
```
Your favorite color is blue. You mentioned this to me earlier!
```

### `POST /memories`
Manually store a memory.

**Request:**
```json
{
  "message": "I have a meeting with Sarah tomorrow at 3pm"
}
```

### `GET /memories`
List all stored memories (for debugging/admin).

**Response:**
```json
{
  "memories": [
    {
      "id": 1,
      "content": "My favorite color is blue",
      "created_at": "2026-03-06T10:30:00"
    }
  ]
}
```

## 🔄 CI/CD & Automation

### GitHub Actions Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `backend-deploy.yml` | Push to main/develop | Deploy FastAPI to Azure Container Apps |
| `flutter-web-deploy.yml` | Push to main/develop | Deploy web app to Azure Static Web Apps |
| `flutter-ios-deploy.yml` | Push to main | Build & upload iOS to TestFlight |
| `pr-checks.yml` | Pull Request | Run tests, linting, type checks |
| `codeql-analysis.yml` | Push/PR/Schedule | Security vulnerability scanning |
| `release.yml` | Tag push (v*) | Create releases with artifacts |
| `cleanup.yml` | Weekly | Remove old workflow runs & artifacts |

### Required GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

**Azure Deployment:**
- `AZURE_CREDENTIALS` - Service principal JSON
- `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
- `AZURE_STATIC_WEB_APPS_API_TOKEN`

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `MISTRAL_API_KEY` - AI model access
- `SECRET_KEY` - Application encryption

**iOS Deployment:**
- `APPLE_ID`, `APPLE_TEAM_ID`
- `APP_SPECIFIC_PASSWORD`
- `IOS_P12_CERTIFICATE`, `IOS_P12_PASSWORD`
- `IOS_PROVISIONING_PROFILE`

**Quality:**
- `CODECOV_TOKEN` - Test coverage reporting

## 🧪 Development & Testing

### Backend Development

```bash
cd backend

# Install dependencies
pip install -e ".[dev]"

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run linting & formatting
ruff check . && ruff check --fix .
black .
isort .
mypy app/
```

### Frontend Development

```bash
cd frontend

# Get dependencies
flutter pub get

# Run tests
flutter test --coverage

# Check code quality
flutter analyze
dart format --output=none --set-exit-if-changed .

# Run on specific device
flutter run -d ios
flutter run -d android
flutter run -d chrome
```

### Pre-commit Hooks

Install automated checks before each commit:

```bash
make setup-hooks
```

This runs ruff, black, flutter analyze, and dart format automatically.

## 📊 Code Quality Standards

- **Backend:** 75%+ test coverage, strict type hints, docstrings
- **Frontend:** 70%+ test coverage, effective Dart style
- **Security:** CodeQL scanning, dependency audits, secret scanning
- **Documentation:** API docs, inline comments, architecture decisions

View coverage: [codecov.io/gh/yourusername/miru](https://codecov.io/gh/yourusername/miru)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

**Quick contribution workflow:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following our code style
4. Run tests: `make test`
5. Run linting: `make lint`
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
7. Push and create a Pull Request

### Development Commands

```bash
# Run everything locally
make backend    # Terminal 1 - FastAPI server
make frontend   # Terminal 2 - Flutter app
make db         # Start PostgreSQL

# Testing
make test       # Run all tests
make test-backend
make test-frontend

# Code quality
make lint       # Check all linting
make fix        # Auto-fix issues
```

## 📚 Documentation

- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Code Style Guide](AGENTS.md) - Coding standards
- [API Reference](backend/app/routes.py) - Auto-generated from code
- [Issue Templates](.github/ISSUE_TEMPLATE/) - Bug reports & features

## 🔒 Security

- **Dependency scanning** - Automated via Dependabot
- **Code analysis** - CodeQL runs on every push
- **Secret detection** - Prevents credential leaks
- **Vulnerability reports** - See [security policy](.github/ISSUE_TEMPLATE/security.md)

## 🌟 Why Miru?

- **Privacy-first** - Your data stays in your database
- **Self-hostable** - Run entirely on your infrastructure
- **Extensible** - Modular architecture for custom features
- **Multi-modal** - Web, mobile, and desktop support
- **Open source** - Transparent and community-driven

## 📄 License

[MIT License](LICENSE) - Open source and free to use

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Flutter](https://flutter.dev/) - Beautiful multi-platform UI
- [Mistral AI](https://mistral.ai/) - State-of-the-art language models
- [PostgreSQL](https://www.postgresql.org/) + [pgvector](https://github.com/pgvector/pgvector) - Vector database
- [Azure](https://azure.microsoft.com/) - Cloud hosting platform

---

<p align="center">Built with ❤️ using FastAPI + Flutter + PostgreSQL</p>
<p align="center"><a href="https://github.com/yourusername/miru">Star us on GitHub</a></p>
