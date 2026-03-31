"""Executing and tracking migrations."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from app.infrastructure.database.migrations.constants import (
    CHECKSUM_FILE,
    ENV_STUBS,
    MIGRATIONS_DIR,
)
from app.infrastructure.database.migrations.generator import (
    _collect_extras,
    _content_checksum,
    _file_checksum,
    _generate_schema_sql,
    _read_checksum,
)

# ---------------------------------------------------------------------------
# Tracking table DDL — created once by ``migrate`` if it doesn't exist
# ---------------------------------------------------------------------------
CREATE_TRACKING_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id          SERIAL PRIMARY KEY,
    name        TEXT        NOT NULL UNIQUE,
    checksum    TEXT        NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.schema_migrations IS
    'Tracks which SQL migration files have been applied to this database.';
""".strip()


def _get_db_url() -> str:
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url or db_url == ENV_STUBS["DATABASE_URL"]:
        print("ERROR: DATABASE_URL is not set. Export it or add it to backend/.env")
        sys.exit(1)
    return db_url


def _psql_run(db_url: str, sql: str) -> None:
    result = subprocess.run(
        ["psql", db_url, "-c", sql],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


def _psql_run_file(db_url: str, path: Path) -> None:
    result = subprocess.run(
        ["psql", db_url, "-f", str(path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


def _get_applied_migrations(db_url: str) -> set[str]:
    result = subprocess.run(
        [
            "psql",
            db_url,
            "--no-align",
            "--tuples-only",
            "-c",
            "SELECT name FROM public.schema_migrations ORDER BY name;",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return set()
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


def _record_migration(db_url: str, name: str, checksum: str) -> None:
    sql = (
        "INSERT INTO public.schema_migrations (name, checksum) "
        "VALUES (:'migration_name', :'migration_checksum') "
        "ON CONFLICT (name) DO NOTHING;"
    )
    result = subprocess.run(
        [
            "psql",
            db_url,
            "--set",
            f"migration_name={name}",
            "--set",
            f"migration_checksum={checksum}",
            "-c",
            sql,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


async def cmd_check() -> None:
    if not CHECKSUM_FILE.exists():
        print("No checksum found — run 'python manage.py makemigrations' first.")
        sys.exit(1)

    schema_sql = await _generate_schema_sql()
    policies, indexes, functions = _collect_extras()

    stored_checksum, bound_filename = _read_checksum()
    current = _content_checksum(schema_sql, policies, indexes, functions)

    if stored_checksum != current:
        print("ERROR: Models have changed without a new migration.")
        print("Run:  python manage.py makemigrations <name>")
        sys.exit(1)

    if bound_filename and not (MIGRATIONS_DIR / bound_filename).exists():
        print(f"ERROR: Migration file '{bound_filename}' is recorded in .last_checksum")
        print("but does not exist in supabase/migrations/.")
        print("Ensure you commit the .sql file together with the snapshot files.")
        sys.exit(1)

    print("OK: Models match the last generated migration.")


def cmd_migrate() -> None:
    db_url = _get_db_url()

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print("No migration files found in supabase/migrations/")
        sys.exit(0)

    print("Ensuring schema_migrations tracking table exists...")
    _psql_run(db_url, CREATE_TRACKING_TABLE_SQL)

    applied = _get_applied_migrations(db_url)

    pending = [f for f in sql_files if f.name not in applied]
    if not pending:
        print("All migrations are already applied — nothing to do.")
        return

    print(f"{len(pending)} pending migration(s) to apply:")
    for f in pending:
        print(f"  • {f.name}")
    print()

    for sql_file in pending:
        print(f"Applying: {sql_file.name}")
        _psql_run_file(db_url, sql_file)
        checksum = _file_checksum(sql_file)
        _record_migration(db_url, sql_file.name, checksum)
        print("  ✓ applied and recorded")

    print()
    print(f"Done — {len(pending)} migration(s) applied.")


def cmd_status() -> None:
    db_url = _get_db_url()

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print("No migration files found in supabase/migrations/")
        return

    _psql_run(db_url, CREATE_TRACKING_TABLE_SQL)
    applied = _get_applied_migrations(db_url)

    print(f"{'Status':<12} Migration")
    print("-" * 60)
    for sql_file in sql_files:
        status = "applied" if sql_file.name in applied else "pending"
        marker = "✓" if status == "applied" else "·"
        print(f"  {marker} [{status:<8}] {sql_file.name}")

    pending_count = sum(1 for f in sql_files if f.name not in applied)
    if pending_count:
        print()
        print(f"{pending_count} pending migration(s). Run: python manage.py migrate")
    else:
        print()
        print("All migrations applied.")
