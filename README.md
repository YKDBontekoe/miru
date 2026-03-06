# Miru - AI Personal Assistant

Miru is a personal AI assistant that remembers you. It features a FastAPI backend with PostgreSQL + pgvector for memory storage, and a Flutter frontend supporting multiple platforms.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MIRU                                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Flutter)          │  Backend (FastAPI)           │
│  ├─ iOS (TestFlight)         │  ├─ Azure Container Apps     │
│  ├─ Android                  │  ├─ PostgreSQL + pgvector    │
│  ├─ Web (Azure Static)       │  └─ Mistral AI API           │
│  └─ Windows                  │                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Flutter SDK 3.19+
- Docker & Docker Compose
- Make

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/miru.git
cd miru

# Setup backend
make setup-backend

# Copy and configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and add your MISTRAL_API_KEY

# Start database
make db

# Run backend (Terminal 1)
make backend

# Run frontend (Terminal 2)
make frontend
```

## 📁 Project Structure

```
.
├── backend/                  # FastAPI backend
│   ├── app/                  # Application code
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI entry point
│   │   ├── routes.py        # API routes
│   │   ├── database.py      # Database connection
│   │   ├── memory.py        # Memory/vector operations
│   │   └── config.py        # Configuration
│   ├── sql/                 # SQL migrations
│   ├── tests/               # Backend tests
│   ├── Dockerfile           # Container image
│   ├── requirements.txt     # Python dependencies
│   └── pyproject.toml       # Tool configurations
├── frontend/                # Flutter frontend
│   ├── lib/                 # Dart source code
│   ├── test/                # Widget tests
│   ├── ios/                 # iOS configuration
│   ├── web/                 # Web configuration
│   ├── pubspec.yaml         # Dart dependencies
│   └── analysis_options.yaml # Linting rules
├── .github/                 # GitHub configuration
│   ├── workflows/           # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   └── dependabot.yml       # Dependency updates
├── docker-compose.yml       # Local development stack
├── Makefile                 # Development commands
└── codecov.yml             # Test coverage config
```

## 🔄 CI/CD Workflows

### Automated Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `backend-deploy.yml` | Push to main/develop | Deploy FastAPI to Azure Container Apps |
| `flutter-web-deploy.yml` | Push to main/develop | Deploy Flutter web to Azure Static Web Apps |
| `flutter-ios-deploy.yml` | Push to main | Build and upload iOS to TestFlight |
| `codeql-analysis.yml` | Push/PR/Schedule | Security code analysis |
| `pr-checks.yml` | Pull Request | Linting, testing, code quality |
| `release.yml` | Tag push | Create releases and build artifacts |
| `cleanup.yml` | Weekly schedule | Clean old artifacts and workflow runs |

### Required Secrets

Configure these in GitHub Settings → Secrets and variables → Actions:

**Azure Deployment:**
- `AZURE_CREDENTIALS` - Azure service principal JSON
- `AZURE_CLIENT_ID` - Azure AD application ID
- `AZURE_CLIENT_SECRET` - Azure AD application secret
- `AZURE_TENANT_ID` - Azure AD tenant ID

**Azure Resources:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Static web apps deployment token
- `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` - Staging environment token

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `MISTRAL_API_KEY` - Mistral AI API key
- `SECRET_KEY` - Application secret key

**iOS Deployment:**
- `APPLE_ID` - Apple Developer ID
- `APP_SPECIFIC_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Apple Developer Team ID
- `IOS_P12_CERTIFICATE` - Base64-encoded P12 certificate
- `IOS_P12_PASSWORD` - P12 certificate password
- `IOS_PROVISIONING_PROFILE` - Base64-encoded provisioning profile
- `IOS_KEYCHAIN_PASSWORD` - Keychain password

**Code Quality:**
- `CODECOV_TOKEN` - Codecov integration token

## 🧪 Testing

### Backend

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run linting
ruff check .
black --check .
mypy app/
```

### Frontend

```bash
cd frontend

# Run tests
flutter test --coverage

# Run linting
flutter analyze
dart format --output=none --set-exit-if-changed .
```

## 📊 Code Quality

We maintain high code quality standards:

- **Backend**: 75%+ test coverage, type hints, docstrings
- **Frontend**: 70%+ test coverage, effective dart style
- **Security**: CodeQL scanning, dependency audits
- **Documentation**: API docs, inline comments

View coverage reports on [Codecov](https://codecov.io/gh/yourusername/miru).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Quick start for contributors:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
6. Push and create a Pull Request

## 📚 Documentation

- [Contributing Guidelines](CONTRIBUTING.md)
- [Issue Templates](.github/ISSUE_TEMPLATE/)
- [API Documentation](backend/app/routes.py) (auto-generated from code)

## 🔐 Security

If you discover a security vulnerability, please follow our [security policy](.github/ISSUE_TEMPLATE/security.md).

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- Flutter team for the cross-platform SDK
- Mistral AI for the language model API
- PostgreSQL team for the database with vector support

---

Built with ❤️ using FastAPI + Flutter + Azure
