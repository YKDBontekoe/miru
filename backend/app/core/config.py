from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str
    # Supabase configuration (replaces local PostgreSQL)
    supabase_url: str
    supabase_key: str
    # Service role key — used ONLY on the backend for admin operations (e.g. minting
    # sessions after passkey login). Never exposed to the client.
    supabase_service_role_key: str
    # JWT secret for verifying Supabase-issued tokens.
    # Get this from Supabase Dashboard > Settings > API > JWT Settings > JWT Secret
    supabase_jwt_secret: str
    # Direct database URL for migrations (Supabase direct connection string)
    # Get this from Supabase Dashboard > Settings > Database > Connection string > URI
    database_url: str | None = None
    # Whether to use SSL for the database connection. Defaults to True for Supabase.
    database_ssl: bool = True
    # Embedding model used for memory storage/retrieval — required, no fallback.
    # Must be a valid OpenRouter embedding model ID, e.g. "openai/text-embedding-3-small"
    embedding_model: str
    # Chat model used for all responses — required, no fallback.
    # Must be a valid OpenRouter model ID, e.g. "google/gemma-3-27b-it:free"
    default_chat_model: str
    # WebAuthn / Passkey configuration
    # rp_id must match the domain of your app exactly (no scheme, no port for standard ports)
    # e.g. "miru.app" for production, "localhost" for local dev
    webauthn_rp_id: str = "localhost"
    webauthn_rp_name: str = "Miru"
    # Comma-separated list of allowed origins for WebAuthn ceremonies
    # e.g. "https://miru.app,https://www.miru.app"
    webauthn_expected_origin: str = "http://localhost"
    # Comma-separated allowed CORS origins — tighten in production
    cors_allowed_origins: str = "*"
    # Tavily Search API key for web search capabilities
    tavily_api_key: str | None = None
    # Steam Web API key for Steam games integration
    steam_api_key: str | None = None
    # Sentry DSN for error tracking
    sentry_dsn: str | None = None
    # Sentry release identifier — set to the Git SHA or version tag at build time.
    # Injected by CI via the SENTRY_RELEASE environment variable.
    sentry_release: str | None = None
    # Sentry environment name, e.g. "production", "staging", "development"
    sentry_environment: str = "development"

    # Neo4j configuration (deprecated but may still be in env)
    neo4j_uri: str | None = None
    neo4j_user: str | None = None
    neo4j_password: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
