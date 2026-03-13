import importlib

from app.core.config import get_settings


def test_tortoise_config_parsing(monkeypatch):
    """Test that the Tortoise configuration correctly strips pgbouncer and adds statement_cache_size."""

    # We want to re-import the module to force it to re-evaluate the module-level code.
    # But before that, we need to mock the setting.
    test_url = "postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"

    monkeypatch.setenv("DATABASE_URL", test_url)

    # Invalidate settings cache
    get_settings.cache_clear()

    import app.infrastructure.database.tortoise as tortoise_mod

    importlib.reload(tortoise_mod)

    raw_url = tortoise_mod.TORTOISE_ORM["connections"]["default"]

    assert "pgbouncer" not in raw_url
    assert "statement_cache_size=0" in raw_url
    assert "connection_limit=1" in raw_url
    assert raw_url.startswith("postgres://")

    # Clean up and restore
    monkeypatch.delenv("DATABASE_URL", raising=False)
    get_settings.cache_clear()
    importlib.reload(tortoise_mod)
