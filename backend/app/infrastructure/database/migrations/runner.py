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
    if not db_url or db_url == ENV_STUBS.get("DATABASE_URL"):
        print("ERROR: DATABASE_URL is not set. Export it or add it to backend/.env")
        sys.exit(1)
    return db_url


def _psql_run(db_url: str, sql: str) -> None:
    result = subprocess.run(
        ["psql", db_url, "-v", "ON_ERROR_STOP=1", "-c", sql],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


def _psql_run_file(db_url: str, path: Path) -> None:
    result = subprocess.run(
        ["psql", db_url, "-v", "ON_ERROR_STOP=1", "-f", str(path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


def _get_applied_migrations(db_url: str, table_name: str = "public.schema_migrations") -> set[str]:
    result = subprocess.run(
        [
            "psql",
            db_url,
            "-v",
            "ON_ERROR_STOP=1",
            "--no-align",
            "--tuples-only",
            "-c",
            f"SELECT name FROM {table_name} ORDER BY name;",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # If the error is just that the table doesn't exist yet, we can safely return empty.
        if "does not exist" in result.stderr:
            return set()
        # Otherwise, hard fail.
        print(f"ERROR: Failed to fetch applied migrations from {table_name}:")
        print(result.stderr)
        sys.exit(result.returncode)
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


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

    # Cross-check with supabase_migrations if it exists to prevent mixed workflows.
    public_applied = _get_applied_migrations(db_url, "public.schema_migrations")
    supabase_applied = _get_applied_migrations(db_url, "supabase_migrations.schema_migrations")

    if supabase_applied and public_applied:
        print("ERROR: Mixed migration workflows detected!")
        print("You have migrations tracked in both public.schema_migrations (manage.py)")
        print("and supabase_migrations.schema_migrations (Supabase CLI).")
        print("Please standardize on a single migration runner to avoid database gaps/conflicts.")
        sys.exit(1)

    applied = public_applied

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
        checksum = _file_checksum(sql_file)
        migration_sql = sql_file.read_text(encoding="utf-8")

        # Apply atomic transaction wrapping migration body + insert query
        # Ensures that a transient runner error won't apply DDL without recording it,
        # and checking if the row already exists locks against double-runs.
        atomic_sql = f"""
BEGIN;
SELECT 1 FROM public.schema_migrations WHERE name = '{sql_file.name}' FOR UPDATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.schema_migrations WHERE name = '{sql_file.name}') THEN
        RAISE EXCEPTION 'Migration already applied: {sql_file.name}';
    END IF;
END $$;
{migration_sql}
INSERT INTO public.schema_migrations (name, checksum) VALUES ('{sql_file.name}', '{checksum}');
COMMIT;
"""
        _psql_run(db_url, atomic_sql)
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
