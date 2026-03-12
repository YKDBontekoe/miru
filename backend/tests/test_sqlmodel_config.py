from app.infrastructure.database.sqlmodel import parse_database_config


def test_parse_database_config_postgres_conversion() -> None:
    url, args = parse_database_config("postgres://user:pass@localhost/db", False)
    assert url == "postgresql+asyncpg://user:pass@localhost/db"
    assert args == {}


def test_parse_database_config_postgresql_conversion() -> None:
    url, args = parse_database_config("postgresql://user:pass@localhost/db", False)
    assert url == "postgresql+asyncpg://user:pass@localhost/db"
    assert args == {}


def test_parse_database_config_no_conversion() -> None:
    url, args = parse_database_config("sqlite:///test.db", False)
    assert url == "sqlite:///test.db"
    assert args == {}


def test_parse_database_config_sslmode_removal() -> None:
    url, args = parse_database_config("postgresql://user:pass@localhost/db?sslmode=disable", False)
    assert "sslmode" not in url
    assert "postgresql+asyncpg://user:pass@localhost/db" in url


def test_parse_database_config_sslmode_removal_with_other_params() -> None:
    url, args = parse_database_config(
        "postgresql://user:pass@localhost/db?sslmode=disable&pool_size=10", False
    )
    assert "sslmode" not in url
    assert "pool_size=10" in url


def test_parse_database_config_supabase_direct_ssl() -> None:
    url, args = parse_database_config(
        "postgresql://user:pass@db.projectref.supabase.co:5432/postgres", True
    )
    assert args == {"ssl": "require"}


def test_parse_database_config_supabase_pooler_ssl() -> None:
    url, args = parse_database_config(
        "postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres", True
    )
    assert args == {"ssl": "require"}


def test_parse_database_config_supabase_ssl_disabled() -> None:
    url, args = parse_database_config(
        "postgresql://user:pass@db.projectref.supabase.co:5432/postgres", False
    )
    assert args == {}


def test_parse_database_config_non_supabase_ssl() -> None:
    url, args = parse_database_config("postgresql://user:pass@db.example.com:5432/postgres", True)
    assert args == {}
