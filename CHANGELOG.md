# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation

- **API**: Flagged undocumented `websocket_chat_hub` endpoint in `backend/app/api/v1/websocket.py` to ensure it is added to OpenAPI schema in future work.
- **Architecture**: Updated `AGENTS.md` and `README.md` to accurately reflect the correct project layer structures (e.g. `use_cases/`, `entities.py`, `interfaces/` in productivity domain) and the `CodeRabbit` AI integration prompt discrepancies.
- **Components**: Added JSDoc blocks to `AgentAvatar` and `BackendSplash` components, and improved the `useAgentStore` hook description to clarify its optimistic update strategies.
- **Setup**: Added missing WebAuthn environment variables (`WEBAUTHN_RP_NAME` and `WEBAUTHN_EXPECTED_ORIGIN`) to the `README.md` setup table to match `.env.example`.
