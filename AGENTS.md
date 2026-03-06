# AGENTS.md - Guidelines for AI Coding Agents

This document provides essential information for AI agents working on the Miru codebase.

## Project Overview

Miru is a personal AI assistant with a **FastAPI backend** (Python) and **Flutter frontend** (Dart). It uses PostgreSQL + pgvector for memory storage and Mistral AI for responses.

## Build / Test / Lint Commands

### Backend (Python)
```bash
cd backend

# Run the server
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run all tests
.venv/bin/pytest --cov=app --cov-report=term-missing

# Run a SINGLE test file
.venv/bin/pytest tests/test_specific.py -v

# Run a SINGLE test function
.venv/bin/pytest tests/test_specific.py::test_function_name -v

# Linting (check only)
ruff check . && black --check . && isort --check-only . && mypy app/

# Auto-fix linting issues
ruff check --fix . && black . && isort .
```

### Frontend (Flutter/Dart)
```bash
cd frontend

# Run the app
flutter run

# Run all tests
flutter test --coverage

# Run a SINGLE test file
flutter test test/widget_test.dart

# Run a SINGLE test
flutter test test/widget_test.dart --name="test name"

# Linting
flutter analyze

# Check formatting
dart format --output=none --set-exit-if-changed .

# Fix formatting
dart format .
```

### Make Commands (Root)
```bash
make setup-backend    # Create venv, install deps
make db               # Start PostgreSQL container
make backend          # Run FastAPI server
make frontend         # Run Flutter app
make test             # Run all tests
make lint             # Run all linting
make fix              # Fix all auto-fixable issues
```

## Code Style Guidelines

### Python (Backend)

**Imports:**
- Use `isort` (Black profile) for import sorting
- Group: stdlib → third-party → first-party (app)
- Example:
```python
from __future__ import annotations  # Always include

import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import APIRouter
from pydantic import BaseModel

from app.database import get_pool
from app.memory import store_memory
```

**Formatting:**
- Line length: 100 characters (configured in pyproject.toml)
- Use double quotes for strings
- Use spaces for indentation (4 spaces)
- Use Black + Ruff for formatting

**Type Hints:**
- Required for all function parameters and return types
- Use `from __future__ import annotations` for forward references
- Use mypy strict mode (configured in pyproject.toml)
```python
async def get_pool() -> asyncpg.Pool:
    ...

async def store_memory(content: str) -> None:
    ...
```

**Naming:**
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private methods: `_leading_underscore`

**Error Handling:**
- Use exceptions for error conditions
- Log errors with context
- Prefer specific exceptions over generic `Exception`

**Documentation:**
- Use Google-style docstrings
- Document all public functions/classes
- Include type info in docstrings sparingly (prefer type hints)

### Dart (Flutter)

**Imports:**
- Use `prefer_relative_imports: true`
- Group: dart: → package: → relative
- Example:
```dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'design_system/design_system.dart';
```

**Formatting:**
- Line length: 80 characters
- Use single quotes for strings
- Prefer `const` constructors where possible
- Use `final` for variables that don't change

**Naming:**
- Files: `snake_case.dart`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `camelCase` (Dart convention)
- Private members: `_leadingUnderscore`

**Types:**
- Use explicit types for public APIs
- Enable strict-casts and strict-raw-types
- Use `Future<void>` not just `Future` for async functions

**State Management:**
- Prefer `const` widgets
- Use `StatelessWidget` when possible
- Keep widgets small and focused

## Conventions

### Git

**Commit Messages:**
Follow Conventional Commits:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Example:
```
feat(backend): add user authentication

Implement JWT-based authentication for API endpoints.
Closes #123
```

**Branch Naming:**
- `feature/description`
- `bugfix/description`
- `hotfix/critical-fix`

### Project Structure

```
backend/
  app/
    __init__.py
    main.py          # FastAPI entry
    routes.py        # API routes
    database.py      # DB connection
    memory.py        # Vector operations
    config.py        # Settings
  tests/             # Test files
  pyproject.toml     # Tool configs

frontend/
  lib/
    main.dart
    chat_page.dart
    api_service.dart
    design_system/   # UI components
      design_system.dart
      components/
      theme/
      tokens/
  test/              # Widget tests
```

### Testing Requirements

- Backend: 75%+ coverage (pytest + pytest-asyncio)
- Frontend: 70%+ coverage (flutter_test)
- Run tests before committing
- Write tests for new features
- Use `async`/`await` for async tests

### Pre-commit Hook

The project has a pre-commit hook that runs:
- `ruff check .`
- `black --check .`
- `flutter analyze`
- `dart format --output=none --set-exit-if-changed .`

Install with: `make setup-hooks`

## Common Tasks

### Adding a New API Endpoint
1. Add route in `backend/app/routes.py`
2. Create Pydantic models for request/response
3. Add tests in `backend/tests/`
4. Run `make test-backend`
5. Run `make lint-backend`

### Adding a New Flutter Screen
1. Create file in `frontend/lib/`
2. Update `main.dart` routing if needed
3. Add widget test in `frontend/test/`
4. Run `flutter test`
5. Run `flutter analyze`

## Environment Setup

Backend requires `.env` file:
```
MISTRAL_API_KEY=your_key_here
DATABASE_URL=postgresql://miru:miru@localhost:5432/miru
```

## Notes

- Python 3.11+ required
- Flutter SDK 3.19+ required
- Docker needed for PostgreSQL
- Never commit secrets to git
- Always run linting before committing
