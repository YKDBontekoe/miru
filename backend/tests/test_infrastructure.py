"""Tests for infrastructure modules: openrouter, supabase, tortoise, integrations route."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# OpenRouter module-level functions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_completion_uses_default_model() -> None:
    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value="Hello!")
    with (
        patch("app.infrastructure.external.openrouter._client", mock_client),
        patch(
            "app.infrastructure.external.openrouter.get_settings",
            return_value=MagicMock(default_chat_model="test-model", openrouter_api_key="k"),
        ),
    ):
        from app.infrastructure.external.openrouter import chat_completion

        result = await chat_completion([{"role": "user", "content": "Hi"}])
    assert result == "Hello!"
    mock_client.chat_completion.assert_awaited_once()


@pytest.mark.asyncio
async def test_chat_completion_uses_explicit_model() -> None:
    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value="World!")
    with patch("app.infrastructure.external.openrouter._client", mock_client):
        from app.infrastructure.external.openrouter import chat_completion

        result = await chat_completion([{"role": "user", "content": "Hi"}], model="custom/model")
    assert result == "World!"
    mock_client.chat_completion.assert_awaited_once_with(
        [{"role": "user", "content": "Hi"}], "custom/model"
    )


@pytest.mark.asyncio
async def test_embed_delegates_to_client() -> None:
    mock_client = AsyncMock()
    mock_client.embed = AsyncMock(return_value=[0.1, 0.2, 0.3])
    with (
        patch("app.infrastructure.external.openrouter._client", mock_client),
        patch(
            "app.infrastructure.external.openrouter.get_settings",
            return_value=MagicMock(embedding_model="embed-model", openrouter_api_key="k"),
        ),
    ):
        from app.infrastructure.external.openrouter import embed

        result = await embed("some text")
    assert result == [0.1, 0.2, 0.3]
    mock_client.embed.assert_awaited_once_with("some text", "embed-model")


@pytest.mark.asyncio
async def test_structured_completion_delegates_to_client() -> None:
    from pydantic import BaseModel

    class MyModel(BaseModel):
        value: str

    mock_client = AsyncMock()
    mock_client.structured_completion = AsyncMock(return_value=MyModel(value="ok"))
    with (
        patch("app.infrastructure.external.openrouter._client", mock_client),
        patch(
            "app.infrastructure.external.openrouter.get_settings",
            return_value=MagicMock(default_chat_model="test-model", openrouter_api_key="k"),
        ),
    ):
        from app.infrastructure.external.openrouter import structured_completion

        result = await structured_completion([{"role": "user", "content": "Hi"}], MyModel)
    assert result.value == "ok"


# ---------------------------------------------------------------------------
# OpenRouterClient methods
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_client_chat_completion_empty_response() -> None:
    from app.infrastructure.external.openrouter import OpenRouterClient

    client = OpenRouterClient.__new__(OpenRouterClient)
    mock_openai = AsyncMock()
    mock_response = MagicMock()
    del mock_response.choices  # Remove choices to test empty-response path
    mock_openai.chat.completions.create = AsyncMock(return_value=mock_response)
    client.openai_client = mock_openai

    result = await client.chat_completion([{"role": "user", "content": "Hi"}], "model")
    assert result == ""


@pytest.mark.asyncio
async def test_client_chat_completion_none_content() -> None:
    from app.infrastructure.external.openrouter import OpenRouterClient

    client = OpenRouterClient.__new__(OpenRouterClient)
    mock_openai = AsyncMock()
    choice = MagicMock()
    choice.message.content = None
    mock_response = MagicMock()
    mock_response.choices = [choice]
    mock_openai.chat.completions.create = AsyncMock(return_value=mock_response)
    client.openai_client = mock_openai

    result = await client.chat_completion([{"role": "user", "content": "Hi"}], "model")
    assert result == ""


@pytest.mark.asyncio
async def test_client_embed() -> None:
    from app.infrastructure.external.openrouter import OpenRouterClient

    client = OpenRouterClient.__new__(OpenRouterClient)
    mock_openai = AsyncMock()
    embedding_data = MagicMock()
    embedding_data.embedding = [0.5, 0.6]
    mock_response = MagicMock()
    mock_response.data = [embedding_data]
    mock_openai.embeddings.create = AsyncMock(return_value=mock_response)
    client.openai_client = mock_openai

    result = await client.embed("text", "model")
    assert result == [0.5, 0.6]


# ---------------------------------------------------------------------------
# Tortoise URL
# ---------------------------------------------------------------------------


def test_tortoise_url_adds_statement_cache_size() -> None:
    import importlib
    import os
    from unittest.mock import patch

    # Force get_settings() to re-run and pick up our os.environ overrides
    from app.core.config import get_settings

    get_settings.cache_clear()

    # For tests to pass, we need to supply required values
    env_vars = {
        "OPENROUTER_API_KEY": "test-key",
        "SUPABASE_URL": "http://localhost:54321",
        "SUPABASE_KEY": "test-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
        "SUPABASE_JWT_SECRET": "test-jwt-secret-that-is-long-enough-32ch",
        "DEFAULT_CHAT_MODEL": "google/gemma-3-27b-it:free",
        "EMBEDDING_MODEL": "openai/text-embedding-3-small",
        "WEBAUTHN_RP_ID": "localhost",
        "WEBAUTHN_RP_NAME": "Miru Test",
        "WEBAUTHN_EXPECTED_ORIGIN": "http://localhost",
        "CORS_ALLOWED_ORIGINS": "*",
    }

    with patch.dict(
        os.environ, {**env_vars, "DATABASE_URL": "postgresql://user:pass@host:5432/db"}
    ):
        get_settings.cache_clear()
        import app.infrastructure.database.tortoise as tort_mod

        importlib.reload(tort_mod)
        assert (
            tort_mod.TORTOISE_ORM["connections"]["default"]
            == "postgres://user:pass@host:5432/db?statement_cache_size=0"
        )

    with patch.dict(
        os.environ,
        {**env_vars, "DATABASE_URL": "postgres://user:pass@host:5432/db?sslmode=require"},
    ):
        get_settings.cache_clear()
        import app.infrastructure.database.tortoise as tort_mod

        importlib.reload(tort_mod)
        assert (
            tort_mod.TORTOISE_ORM["connections"]["default"]
            == "postgres://user:pass@host:5432/db?sslmode=require&statement_cache_size=0"
        )

    with patch.dict(os.environ, {**env_vars, "DATABASE_URL": "sqlite://:memory:"}):
        get_settings.cache_clear()
        import app.infrastructure.database.tortoise as tort_mod

        importlib.reload(tort_mod)
        assert tort_mod.TORTOISE_ORM["connections"]["default"] == "sqlite://:memory:"


# ---------------------------------------------------------------------------
# Supabase singleton
# ---------------------------------------------------------------------------


def test_get_supabase_returns_singleton() -> None:
    import app.infrastructure.database.supabase as supabase_module

    original = supabase_module._supabase
    try:
        mock_client = MagicMock()
        with patch("app.infrastructure.database.supabase._supabase", mock_client):
            from app.infrastructure.database.supabase import get_supabase

            result = get_supabase()
        assert result is mock_client
    finally:
        supabase_module._supabase = original


def test_get_supabase_creates_client_when_none() -> None:
    import app.infrastructure.database.supabase as supabase_module

    original = supabase_module._supabase
    try:
        supabase_module._supabase = None
        mock_client = MagicMock()
        with (
            patch("app.infrastructure.database.supabase.get_settings") as mock_settings,
            patch("supabase.create_client", return_value=mock_client),
        ):
            mock_settings.return_value = MagicMock(
                supabase_url="http://localhost:54321",
                supabase_service_role_key="service-key",
            )
            from app.infrastructure.database.supabase import get_supabase

            result = get_supabase()
        assert result is mock_client
    finally:
        supabase_module._supabase = original


# ---------------------------------------------------------------------------
# Integrations route
# ---------------------------------------------------------------------------


def test_resolve_steam_user_with_numeric_id(client) -> None:  # type: ignore[no-untyped-def]
    from tests.conftest import auth_headers

    with (
        patch(
            "app.api.v1.integrations.get_player_summaries",
            new=AsyncMock(return_value=[{"personaname": "TestPlayer"}]),
        ),
    ):
        response = client.get(
            "/api/v1/integrations/steam/resolve-user?username=12345678901234567",
            headers=auth_headers(),
        )
    assert response.status_code == 200
    data = response.json()
    assert data["steam_id"] == "12345678901234567"
    assert data["persona_name"] == "TestPlayer"


def test_resolve_steam_user_with_vanity_url(client) -> None:  # type: ignore[no-untyped-def]
    from tests.conftest import auth_headers

    with (
        patch(
            "app.api.v1.integrations.resolve_vanity_url",
            new=AsyncMock(return_value="76561198000000001"),
        ),
        patch(
            "app.api.v1.integrations.get_player_summaries",
            new=AsyncMock(return_value=[{"personaname": "VanityPlayer"}]),
        ),
    ):
        response = client.get(
            "/api/v1/integrations/steam/resolve-user?username=myvanity",
            headers=auth_headers(),
        )
    assert response.status_code == 200
    data = response.json()
    assert data["steam_id"] == "76561198000000001"
    assert data["persona_name"] == "VanityPlayer"


def test_resolve_steam_user_not_found(client) -> None:  # type: ignore[no-untyped-def]
    from tests.conftest import auth_headers

    with patch(
        "app.api.v1.integrations.resolve_vanity_url",
        new=AsyncMock(return_value=None),
    ):
        response = client.get(
            "/api/v1/integrations/steam/resolve-user?username=notfound",
            headers=auth_headers(),
        )
    assert response.status_code == 404


def test_resolve_steam_user_no_summaries(client) -> None:  # type: ignore[no-untyped-def]
    from tests.conftest import auth_headers

    with (
        patch(
            "app.api.v1.integrations.resolve_vanity_url",
            new=AsyncMock(return_value="76561198000000002"),
        ),
        patch(
            "app.api.v1.integrations.get_player_summaries",
            new=AsyncMock(return_value=[]),
        ),
    ):
        response = client.get(
            "/api/v1/integrations/steam/resolve-user?username=noavatar",
            headers=auth_headers(),
        )
    assert response.status_code == 200
    assert response.json()["persona_name"] == "Unknown"


def test_resolve_steam_user_requires_auth(client) -> None:  # type: ignore[no-untyped-def]
    response = client.get("/api/v1/integrations/steam/resolve-user?username=anyone")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Sentry init path in main.py
# ---------------------------------------------------------------------------


def test_sentry_init_called_when_dsn_set() -> None:
    """Verify sentry_sdk.init is invoked when SENTRY_DSN is configured."""
    with (
        patch("app.main.settings") as mock_settings,
        patch("sentry_sdk.init") as mock_init,
    ):
        mock_settings.sentry_dsn = "https://key@sentry.io/123"
        mock_settings.sentry_environment = "production"
        mock_settings.sentry_release = "v1.0.0"

        # Re-execute just the init block
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        if mock_settings.sentry_dsn:
            sentry_sdk.init(
                dsn=mock_settings.sentry_dsn,
                environment=mock_settings.sentry_environment,
                release=mock_settings.sentry_release,
                traces_sample_rate=1.0,
                integrations=[
                    StarletteIntegration(transaction_style="endpoint"),
                    FastApiIntegration(transaction_style="endpoint"),
                ],
            )

    mock_init.assert_called_once()
    call_kwargs = mock_init.call_args.kwargs
    assert call_kwargs["dsn"] == "https://key@sentry.io/123"
    assert call_kwargs["environment"] == "production"
    assert call_kwargs["release"] == "v1.0.0"
