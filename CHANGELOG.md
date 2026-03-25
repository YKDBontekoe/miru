# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026-03-25]

### Added
- **Backend Architecture**: Introduced `productivity`, `integrations`, `notifications`, `agent_tools`, and `websocket` domain packages to support new feature modules.
- **WebSocket Infrastructure**: Real-time signal routing (SignalR-compatible) for chat rooms.
- **Passkey Support**: Initial endpoints and models for WebAuthn passkey authentication.

### Changed
- **AI Automation**: Refined triggers and lifecycle management for automated AI coding agents. CodeRabbit rate-limiting queue processor now retries automatically every 30 minutes. Jules performance reports are generated on a weekly schedule (Mondays 9 AM UTC).
- **Backend Documentation**: Updated backend API endpoints (e.g. Chat, Memory, Auth, Productivity, Integrations) with accurate OpenAPI schemas and descriptions, removing "undocumented endpoint" flags.
- **Frontend Documentation**: Added structured JSDoc blocks to core UI components (`AppButton`, `AppCard`, `AppText`, `ChatBubble`, etc.) and Zustand hooks (`useChatStore`, `useAuthStore`, `useAppStore`, `useProductivityStore`) to improve developer onboarding.
- **AGENTS.md**: Synchronised agent scopes and backend architecture diagrams with the current implementation.
