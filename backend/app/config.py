from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mistral_api_key: str
    database_url: str = "postgresql://miru:miru@localhost:5432/miru"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()  # type: ignore[call-arg]
