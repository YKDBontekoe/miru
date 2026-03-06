from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str
    # Supabase configuration (replaces local PostgreSQL)
    supabase_url: str
    supabase_key: str
    # Direct database URL for migrations (Supabase direct connection string)
    # Get this from Supabase Dashboard > Settings > Database > Connection string > URI
    database_url: str | None = None
    # Default model used for embeddings (OpenAI-compatible via OpenRouter)
    embedding_model: str = "openai/text-embedding-3-small"
    # Default chat model; can be overridden per-request by the frontend
    default_chat_model: str = "anthropic/claude-3.5-sonnet"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()  # type: ignore[call-arg]
