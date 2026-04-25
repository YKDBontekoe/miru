# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation

- **API** (2025-04-25): Flagged undocumented `websocket_chat_hub` endpoint in `backend/app/api/v1/websocket.py` to ensure it is added to OpenAPI schema in future work.
- **Architecture** (2025-04-25): Updated `AGENTS.md` and `README.md` to accurately reflect the correct project layer structures (e.g. `use_cases/`, `entities.py`, `interfaces/`, `dependencies.py` in productivity domain) and the `CodeRabbit` and `Jules` AI integration prompt discrepancies and trigger conditions.
- **Components** (2025-04-25): Added JSDoc blocks to `AgentAvatar` and `BackendSplash` components, and improved the `useAgentStore` hook description to clarify its optimistic update strategies.
- **Components** (2025-04-25): Added JSDoc blocks to `useAppStore`, `useMemoryStore`, and `useDebounce` to improve code comprehension and enforce documentation standards.
- **Setup** (2025-04-25): Added missing WebAuthn environment variables (`WEBAUTHN_RP_NAME` and `WEBAUTHN_EXPECTED_ORIGIN`) to the `README.md` setup table to match `.env.example`.
