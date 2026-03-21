# Contributing to Miru

Thank you for your interest in contributing to Miru! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Deployment](#deployment)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- **Backend**: Python 3.11+, Docker
- **Frontend**: Node.js 18+, npm/yarn/bun
- **Tools**: Git, Make

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/miru.git`
3. Install dependencies:
   ```bash
   # Backend
   make setup-backend
   
   # Frontend
   cd frontend && npm install
   ```
4. Start the database: `make db`
5. Run the backend: `make backend`
6. Run the frontend (in another terminal): `make frontend`

## Development Workflow

### Branching Strategy

We use GitHub Flow:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical production fixes

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(backend): add user authentication

Implement JWT-based authentication for API endpoints.
Includes login, logout, and token refresh functionality.

Closes #123
```

## Pull Request Process

1. **Before submitting**:
   - Ensure all tests pass
   - Update documentation if needed
   - Run linting and type checking
   - Add tests for new features

2. **PR Title Format**:
   ```
   [TYPE] Brief description
   
   Example: [FEAT] Add dark mode toggle
   ```

3. **PR Description** should include:
   - What changes were made
   - Why the changes were made
   - How to test the changes
   - Screenshots (for UI changes)
   - Related issues

4. **Review Process**:
   - At least one approval required
   - All CI checks must pass
   - Address review comments
   - Squash commits before merging

5. **After Merge**:
   - Delete your branch
   - Monitor deployments

## Coding Standards

### Python (Backend)

We use:
- **Ruff**: Linting and formatting
- **Black**: Code formatting
- **isort**: Import sorting
- **MyPy**: Type checking

Run checks locally:
```bash
cd backend
ruff check .
black --check .
isort --check-only .
mypy app/
```

Style guidelines:
- Follow PEP 8
- Use type hints
- Write docstrings (Google style)
- Maximum line length: 100 characters

### TypeScript (React Native)

We use:
- **ESLint**: Linting and standardisation
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

Run checks locally:
```bash
cd frontend
npm run lint
npm run type-check
```

Style guidelines:
- Use functional components and hooks
- Use NativeWind for styling
- Follow the structure in `src/` for stores, components, and services
- Maximum line length: 100 characters (ESLint/Prettier default)

## Testing

### Backend Tests

```bash
cd backend
pytest --cov=app --cov-report=html
```

Requirements:
- Unit tests for all new functions
- Integration tests for API endpoints
- Minimum 75% code coverage

### Frontend Tests

```bash
cd frontend
npm test
```

Requirements:
- Component tests for UI components
- Integration tests for critical flows
- Minimum 70% code coverage

## Deployment

### Automated Deployments

- **Main branch** → Production
- **Develop branch** → Staging

### Deployment Process

1. Backend: Docker image built and deployed to Azure Container Apps
2. Frontend Web: Built and deployed to Azure Static Web Apps
3. Frontend App (Expo): Built and uploaded to App Store / Play Store

### Manual Deployment

Only for hotfixes or special cases:
```bash
# Backend
make deploy-backend

# Frontend (Web)
make deploy-web

# Frontend (App)
make deploy-app
```

## Questions?

- Open an issue for questions
- Join our discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing! 🎉
