from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str
    # Supabase configuration (replaces local PostgreSQL)
    supabase_url: str
    supabase_key: str
    # Direct database URL for migrations (Supabase direct connection string)
    # Get this from Supabase Dashboard > Settings > Database > Connection string > URI
    database_url: str | None = None
    # Embedding model used for memory storage/retrieval — required, no fallback.
    # Must be a valid OpenRouter embedding model ID, e.g. "openai/text-embedding-3-small"
    embedding_model: str
    # Chat model used for all responses — required, no fallback.
    # Must be a valid OpenRouter model ID, e.g. "google/gemma-3-27b-it:free"
    default_chat_model: str
    # Neo4j Graph Database configuration
    neo4j_uri: str
    neo4j_user: str = "neo4j"
    neo4j_password: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
