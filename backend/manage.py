"""Migration CLI — the 'dotnet ef' equivalent for Miru.

Usage
-----
    python manage.py makemigrations <name>   Generate a Supabase SQL migration
    python manage.py migrate                 Apply pending migrations via psql
    python manage.py check                   Exit 1 if models differ from last migration

Workflow (mirrors Entity Framework)
------------------------------------
1. Edit a model in ``app/domain/**/models.py``, including any ``sql_policies``,
   ``sql_indexes``, or ``sql_functions`` on its ``Meta`` class.
2. Run ``python manage.py makemigrations <name>`` to generate a timestamped SQL
   file in ``../supabase/migrations/``.
3. Review the generated file, then apply with ``python manage.py migrate`` or via
   the Supabase CLI (``supabase db push``).
"""

from __future__ import annotations

import hashlib
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Bootstrap: stub required env vars so Pydantic Settings doesn't fail when
# this script is run outside a fully configured environment.
# ---------------------------------------------------------------------------
_ENV_STUBS = {
    "OPENROUTER_API_KEY": "stub",
    "SUPABASE_URL": "http://localhost",
    "SUPABASE_KEY": "stub",
    "SUPABASE_SERVICE_ROLE_KEY": "stub",
    "SUPABASE_JWT_SECRET": "stub-secret-long-enough-for-hs256-x",
    "EMBEDDING_MODEL": "openai/text-embedding-3-small",
    "DEFAULT_CHAT_MODEL": "google/gemma-3-27b-it:free",
    "DATABASE_URL": "postgres://postgres:postgres@localhost:5432/postgres",
}
for _k, _v in _ENV_STUBS.items():
    os.environ.setdefault(_k, _v)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
MIGRATIONS_DIR = Path(__file__).parent.parent / "supabase" / "migrations"
CHECKSUM_FILE = MIGRATIONS_DIR / ".last_checksum"

# ---------------------------------------------------------------------------
# All application models — keep this list in sync with TORTOISE_ORM
# ---------------------------------------------------------------------------
ALL_MODEL_MODULES = [
    "app.domain.agents.models",
    "app.domain.auth.models",
    "app.domain.chat.models",
    "app.domain.memory.models",
    "app.domain.agent_tools.models",
]


# ---------------------------------------------------------------------------
# Seed data — edit here to change what gets included in every fresh migration
# ---------------------------------------------------------------------------
SEED_SQL: list[str] = [
    "-- Seed: Capabilities",
    (
        "INSERT INTO public.capabilities (id, name, description, icon) VALUES "
        "('web_search', 'Web Search', 'Search the internet for real-time information.', 'search'), "
        "('code_execution', 'Code Execution', 'Write and run code in a sandbox.', 'terminal'), "
        "('image_generation', 'Image Generation', 'Create unique images from text descriptions.', 'image') "
        "ON CONFLICT (id) DO NOTHING;"
    ),
    "-- Seed: Integrations",
    (
        "INSERT INTO public.integrations "
        "(id, display_name, description, icon, status, config_schema) VALUES "
        "('steam', 'Steam', 'Connect to your Steam profile to view games and activity.', "
        "'videogame_asset', 'active', "
        '\'[{"key": "steam_id", "label": "Steam ID (Steam64)", "type": "string", '
        '"required": true, "description": "Your 17-digit Steam ID"}]\'::jsonb) '
        "ON CONFLICT (id) DO NOTHING;"
    ),
    "-- Seed: Agent Templates",
    (
        "INSERT INTO public.agent_templates (id, name, description, personality, goals) VALUES "
        "(gen_random_uuid(), 'The Librarian', "
        "'A master of organization and archival data.', "
        "'You are calm, meticulous, and obsessed with metadata. "
        "You speak formally and value precision.', "
        '\'["Catalog personal memories accurately", '
        '"Assist in finding old information", '
        '"Suggest logical groupings for data"]\'::jsonb) '
        "ON CONFLICT DO NOTHING;"
    ),
]


# ---------------------------------------------------------------------------
# Core: schema generation
# ---------------------------------------------------------------------------


async def _generate_schema_sql() -> str:
    """Ask Tortoise to produce PostgreSQL-compatible CREATE TABLE DDL for all models.

    We always use the asyncpg schema generator regardless of the actual connection,
    so the output is Postgres DDL (UUID, JSONB, TIMESTAMPTZ) rather than SQLite DDL.
    """
    from tortoise import Tortoise
    from tortoise.backends.asyncpg.schema_generator import AsyncpgSchemaGenerator

    await Tortoise.init(
        db_url="sqlite://:memory:",
        modules={"models": ALL_MODEL_MODULES},
    )
    conn = Tortoise.get_connection("default")
    sql = AsyncpgSchemaGenerator(conn).get_create_schema_sql()
    await Tortoise.close_connections()
    return sql


def _collect_extras() -> tuple[list[str], list[str], list[str]]:
    """Walk every SupabaseModel subclass and collect Meta SQL attributes.

    Returns (policies, indexes, functions) — in dependency order (functions
    before policies so triggers can reference the functions they call).
    """
    # Import all model modules so subclasses are registered
    import importlib

    for module_path in ALL_MODEL_MODULES:
        importlib.import_module(module_path)

    from app.infrastructure.database.base import SupabaseModel

    policies: list[str] = []
    indexes: list[str] = []
    functions: list[str] = []

    # Iterate in definition order (MRO breadth-first within each module)
    for cls in SupabaseModel.__subclasses__():
        _walk_subclass(cls, policies, indexes, functions)

    return policies, indexes, functions


def _walk_subclass(
    cls: type,
    policies: list[str],
    indexes: list[str],
    functions: list[str],
) -> None:
    """Recursively collect SQL extras from a class and its subclasses."""
    meta = getattr(cls, "Meta", None)
    if meta and not getattr(meta, "abstract", False):
        policies.extend(getattr(meta, "sql_policies", []))
        indexes.extend(getattr(meta, "sql_indexes", []))
        functions.extend(getattr(meta, "sql_functions", []))
    for sub in cls.__subclasses__():
        _walk_subclass(sub, policies, indexes, functions)


def _build_migration_sql(
    name: str, schema_sql: str, policies: list[str], indexes: list[str], functions: list[str]
) -> str:
    """Assemble the full migration SQL string."""
    lines: list[str] = [
        f"-- Migration: {name}",
        f"-- Generated: {datetime.now(UTC).isoformat()}",
        "",
        "CREATE EXTENSION IF NOT EXISTS vector;",
        "",
        "-- Schema ----------------------------------------------------------------",
        "",
        # Tortoise outputs JSONB for embedding; patch to vector(1536) for pgvector
        schema_sql.replace('"embedding" JSONB', '"embedding" vector(1536)'),
    ]

    if functions:
        lines += [
            "",
            "-- Functions & Triggers --------------------------------------------------",
            "",
        ]
        lines += [stmt.strip() for stmt in functions]

    if policies:
        lines += [
            "",
            "-- Row Level Security ----------------------------------------------------",
            "",
        ]
        lines += [stmt.strip() for stmt in policies]

    if indexes:
        lines += [
            "",
            "-- Custom Indexes --------------------------------------------------------",
            "",
        ]
        lines += [stmt.strip() for stmt in indexes]

    if SEED_SQL:
        lines += [
            "",
            "-- Seed Data -------------------------------------------------------------",
            "",
        ]
        lines += SEED_SQL

    return "\n".join(lines) + "\n"


def _content_checksum(
    schema_sql: str, policies: list[str], indexes: list[str], functions: list[str]
) -> str:
    """Checksum over schema content only — independent of migration name/timestamp."""
    content = "\n".join([schema_sql] + functions + policies + indexes)
    return hashlib.sha256(content.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


async def cmd_makemigrations(name: str) -> None:
    """Generate a new timestamped Supabase migration file."""
    print(f"Generating migration: {name}")

    schema_sql = await _generate_schema_sql()
    policies, indexes, functions = _collect_extras()
    migration_sql = _build_migration_sql(name, schema_sql, policies, indexes, functions)

    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{name}.sql"
    output_path = MIGRATIONS_DIR / filename

    MIGRATIONS_DIR.mkdir(parents=True, exist_ok=True)
    output_path.write_text(migration_sql, encoding="utf-8")
    CHECKSUM_FILE.write_text(
        _content_checksum(schema_sql, policies, indexes, functions), encoding="utf-8"
    )

    print(f"Created:  supabase/migrations/{filename}")
    print("Review it, then run:  python manage.py migrate")


async def cmd_check() -> None:
    """Exit with code 1 if models have changed since the last migration.

    Used by the CI pipeline to catch uncommitted schema changes.
    """
    if not CHECKSUM_FILE.exists():
        print("No checksum found — run 'python manage.py makemigrations' first.")
        sys.exit(1)

    schema_sql = await _generate_schema_sql()
    policies, indexes, functions = _collect_extras()

    stored = CHECKSUM_FILE.read_text(encoding="utf-8").strip()
    current = _content_checksum(schema_sql, policies, indexes, functions)

    if stored != current:
        print("ERROR: Models have changed without a new migration.")
        print("Run:  python manage.py makemigrations <name>")
        sys.exit(1)

    print("OK: Models match the last generated migration.")


def cmd_migrate() -> None:
    """Apply all pending migrations via psql.

    Requires DATABASE_URL to be set in the environment (or .env file).
    """
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url or db_url == _ENV_STUBS["DATABASE_URL"]:
        print("ERROR: DATABASE_URL is not set. Export it or add it to backend/.env")
        sys.exit(1)

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print("No migration files found in supabase/migrations/")
        sys.exit(0)

    for sql_file in sql_files:
        print(f"Applying: {sql_file.name}")
        result = subprocess.run(
            ["psql", db_url, "-f", str(sql_file)],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(result.stderr)
            sys.exit(result.returncode)
        print("  OK")

    print("All migrations applied.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import asyncio

    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(0)

    command = args[0]

    if command == "makemigrations":
        if len(args) < 2:
            print("Usage: python manage.py makemigrations <name>")
            sys.exit(1)
        asyncio.run(cmd_makemigrations(args[1]))

    elif command == "check":
        asyncio.run(cmd_check())

    elif command == "migrate":
        cmd_migrate()

    else:
        print(f"Unknown command: {command!r}")
        print("Available commands: makemigrations, check, migrate")
        sys.exit(1)
