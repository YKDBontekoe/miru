# Steam Integration Refactoring Plan
1. *Identify violations in `steam.py` and `integrations.py`*
    - The Steam external integration (`get_player_summaries`, `get_owned_games`, `resolve_vanity_url`) currently exists as standalone utility functions in `app/infrastructure/external/steam.py`.
    - The FastAPI route `resolve_steam_user` in `app/api/v1/integrations.py` directly calls these infrastructure functions containing business logic and HTTP operations.
2. *Implement Dependency Inversion and the Layer Contract*
    - Define an interface `ISteamClient` in the domain layer (`app.domain.integrations.interfaces.steam_client`).
    - Move business orchestration to an Application Use Case `ResolveSteamUserUseCase` in `app.domain.integrations.use_cases.resolve_steam_user`.
    - Create a concrete class `SteamClient` in `app.infrastructure.external.steam_client` that implements `ISteamClient`.
3. *Refactor FastAPI Route*
    - Update `resolve_steam_user` in `app/api/v1/integrations.py` to use dependency injection to get `ResolveSteamUserUseCase` and call it.
4. *Update Agent Tools and Tests*
    - Refactor `SteamOwnedGamesTool` and `SteamPlayerSummaryTool` in `app/infrastructure/external/steam_tool.py` to instantiate and use the class-based `SteamClient`.
    - Update the related pytest suite in `tests/test_steam_tool.py` and `tests/test_steam_api.py` to patch the class methods and execute without warnings/errors.
5. *Ensure testing, verifications, review, and reflection are done*
    - Will call pre-commit instructions, ensure all linters pass, and tests execute cleanly.
6. *Submit the change.*
    - Commit code with descriptive commit message and push.
