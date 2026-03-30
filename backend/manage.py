"""Migration CLI — the 'dotnet ef' equivalent for Miru.

Usage
-----
    python manage.py makemigrations <name>   Generate an incremental Supabase SQL migration
    python manage.py makemigrations <name> --full
                                             Generate a full-schema migration (initial / squash)
    python manage.py migrate                 Apply pending migrations (tracks applied files)
    python manage.py check                   Exit 1 if models differ from last migration
    python manage.py status                  Show which migrations have / have not been applied

Workflow (mirrors Entity Framework / Django)
--------------------------------------------
1. Edit a model in ``app/domain/**/models.py``, including any ``sql_policies``,
   ``sql_indexes``, or ``sql_functions`` on its ``Meta`` class.
2. Run ``python manage.py makemigrations <name>`` to generate an incremental timestamped
   SQL file in ``../supabase/migrations/``.  For the very first migration, or when you want
   to squash history, pass ``--full``.
3. Review the generated file, then apply with ``python manage.py migrate``.

Incremental migration strategy
-------------------------------
* A ``schema_migrations`` table is created in the database on the first ``migrate`` run.
  It records each applied migration file by name, its SHA-256 checksum, and the
  timestamp it was applied.
* ``migrate`` only applies files whose name is NOT already in that table, so running it
  repeatedly is safe (fully idempotent at the file level).
* ``makemigrations`` (without ``--full``) stores a **schema snapshot** in
  ``supabase/migrations/.schema_snapshot`` after each run.  On the next call it compares
  the current model DDL against that snapshot and emits only the diff: new tables, dropped
  tables, added/removed columns, new indexes, and updated policies.  You should always
  review the generated SQL before applying it.
* ``makemigrations --full`` regenerates the entire schema (CREATE TABLE IF NOT EXISTS for
  every table) and resets the snapshot.  Use this for the initial migration or after
  manually squashing history.
"""

from __future__ import annotations

import hashlib
import os
import re
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, cast

if TYPE_CHECKING:
    from tortoise.backends.asyncpg.client import AsyncpgDBClient

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
}
for _k, _v in _ENV_STUBS.items():
    os.environ.setdefault(_k, _v)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
MIGRATIONS_DIR = Path(__file__).parent.parent / "supabase" / "migrations"
CHECKSUM_FILE = MIGRATIONS_DIR / ".last_checksum"
SNAPSHOT_FILE = MIGRATIONS_DIR / ".schema_snapshot"

# ---------------------------------------------------------------------------
# All application models — keep this list in sync with TORTOISE_ORM
# ---------------------------------------------------------------------------
ALL_MODEL_MODULES = [
    "app.infrastructure.database.models.agents_models",
    "app.domain.auth.models",
    "app.infrastructure.database.models.chat_models",
    "app.domain.memory.models",
    "app.domain.agent_tools.models",
    "app.domain.productivity.models",
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
        '"Suggest logical groupings for data"]\'::jsonb), '
        "(gen_random_uuid(), 'The Developer', "
        "'An expert software engineer who writes clean, efficient code.', "
        "'You are logical, concise, and focused on best practices. You prefer code examples over long explanations.', "
        '\'["Write efficient and maintainable code", '
        '"Debug complex issues", '
        '"Explain technical concepts clearly"]\'::jsonb), '
        "(gen_random_uuid(), 'The Therapist', "
        "'A compassionate and empathetic listener.', "
        "'You are warm, non-judgmental, and deeply empathetic. You ask reflective questions to help users understand their feelings.', "
        '\'["Provide emotional support", '
        '"Encourage self-reflection", '
        '"Offer practical coping strategies"]\'::jsonb), '
        "(gen_random_uuid(), 'The Creative Writer', "
        "'A master wordsmith who excels at storytelling and creative prose.', "
        "'You are imaginative, expressive, and passionate about language. You use vivid imagery and engaging narratives.', "
        '\'["Brainstorm creative ideas", '
        '"Draft engaging stories or articles", '
        '"Improve the flow and tone of writing"]\'::jsonb), '
        "(gen_random_uuid(), 'The Researcher', "
        "'A meticulous investigator who digs deep to find accurate information.', "
        "'You are objective, detail-oriented, and rely on facts. You always cite sources and provide comprehensive summaries.', "
        '\'["Gather accurate information on any topic", '
        '"Summarize long documents or articles", '
        '"Verify facts and debunk misinformation"]\'::jsonb), '
        "(gen_random_uuid(), 'The Analyst', "
        "'A data-driven thinker who excels at finding patterns and insights.', "
        "'You are analytical, structured, and focused on metrics. You prefer presenting information in clear, actionable formats.', "
        '\'["Analyze complex data sets", '
        '"Identify trends and patterns", '
        '"Provide actionable recommendations"]\'::jsonb), '
        "(gen_random_uuid(), 'The Comedian', "
        "'A quick-witted humorist who lightens the mood with jokes and satire.', "
        "'You are funny, irreverent, and always looking for the punchline. You use humor to make interactions enjoyable.', "
        '\'["Entertain the user", '
        '"Write jokes or humorous scripts", '
        '"Lighten the mood during stressful situations"]\'::jsonb), '
        "(gen_random_uuid(), 'The Fitness Coach', "
        "'A motivating and knowledgeable personal trainer.', "
        "'You are energetic, encouraging, and focused on health. You provide structured advice and positive reinforcement.', "
        '\'["Create personalized workout plans", '
        '"Provide nutritional advice", '
        '"Keep the user motivated and accountable"]\'::jsonb), '
        "(gen_random_uuid(), 'The Translator', "
        "'A fluent polyglot who accurately translates text while preserving nuance.', "
        "'You are culturally aware, precise, and respectful of linguistic nuances. You prioritize natural-sounding translations.', "
        '\'["Translate text accurately between languages", '
        '"Explain cultural context and idioms", '
        '"Help the user learn a new language"]\'::jsonb), '
        "(gen_random_uuid(), 'The Project Manager', "
        "'An organized and efficient coordinator who keeps things on track.', "
        "'You are structured, proactive, and focused on deadlines. You excel at breaking down large tasks into manageable steps.', "
        '\'["Organize complex projects", '
        '"Create actionable task lists", '
        '"Track progress and identify bottlenecks"]\'::jsonb), '
        "(gen_random_uuid(), 'The Chef', "
        "'A culinary expert who creates delicious recipes and cooking tips.', "
        "'You are passionate about food, creative, and encouraging. You provide clear, step-by-step cooking instructions.', "
        '\'["Suggest recipes based on available ingredients", '
        '"Provide cooking techniques and tips", '
        '"Help plan meals and menus"]\'::jsonb) '
        "ON CONFLICT (id) DO NOTHING;"
    ),
]

# ---------------------------------------------------------------------------
# Tracking table DDL — created once by ``migrate`` if it doesn't exist
# ---------------------------------------------------------------------------
_CREATE_TRACKING_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id          SERIAL PRIMARY KEY,
    name        TEXT        NOT NULL UNIQUE,
    checksum    TEXT        NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.schema_migrations IS
    'Tracks which SQL migration files have been applied to this database.';
""".strip()


# ---------------------------------------------------------------------------
# Core: schema generation
# ---------------------------------------------------------------------------


async def _generate_schema_sql() -> str:
    """Ask Tortoise to produce PostgreSQL-compatible CREATE TABLE DDL for all models.

    We always use the asyncpg schema generator regardless of the actual connection,
    so the output is Postgres DDL (UUID, JSONB, TIMESTAMPTZ) rather than SQLite DDL.
    Patches the ``embedding`` column from JSONB → vector(1536) for pgvector.
    """
    from tortoise import Tortoise
    from tortoise.backends.asyncpg.schema_generator import AsyncpgSchemaGenerator

    await Tortoise.init(
        db_url="sqlite://:memory:",
        modules={"models": ALL_MODEL_MODULES},
    )
    conn = cast("AsyncpgDBClient", Tortoise.get_connection("default"))
    sql = AsyncpgSchemaGenerator(conn).get_create_schema_sql()
    await Tortoise.close_connections()
    # Patch: Tortoise emits JSONB for vector fields; replace with pgvector type.
    return sql.replace('"embedding" JSONB', '"embedding" vector(1536)')


def _collect_extras() -> tuple[list[str], list[str], list[str]]:
    """Walk every SupabaseModel subclass and collect Meta SQL attributes.

    Returns (policies, indexes, functions) — in dependency order (functions
    before policies so triggers can reference the functions they call).
    """
    import importlib

    for module_path in ALL_MODEL_MODULES:
        importlib.import_module(module_path)

    from app.infrastructure.database.base import SupabaseModel

    policies: list[str] = []
    indexes: list[str] = []
    functions: list[str] = []

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


def _idempotent_policy_stmt(stmt: str) -> str:
    """Prepend DROP POLICY IF EXISTS before a CREATE POLICY statement."""
    m = re.match(
        r"CREATE\s+POLICY\s+(\S+)\s+ON\s+(public\.\S+|\"?\S+\"?)",
        stmt.strip(),
        re.IGNORECASE,
    )
    if m:
        policy_name, table_name = m.group(1), m.group(2)
        if not table_name.startswith("public."):
            table_name = f"public.{table_name}"
        return f"DROP POLICY IF EXISTS {policy_name} ON {table_name};\n{stmt.strip()}"
    return stmt.strip()


def _idempotent_function_stmt(stmt: str) -> str:
    """Prepend DROP TRIGGER IF EXISTS before CREATE TRIGGER statements.

    CREATE OR REPLACE FUNCTION is already idempotent; only triggers need a guard.
    """
    m = re.match(
        r"CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+(\S+)\s+\S+\s+\S+\s+ON\s+(\S+)",
        stmt.strip(),
        re.IGNORECASE,
    )
    if m:
        trigger_name, table_name = m.group(1), m.group(2)
        return f"DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};\n{stmt.strip()}"
    return stmt.strip()


def _content_checksum(
    schema_sql: str, policies: list[str], indexes: list[str], functions: list[str]
) -> str:
    """Checksum over schema content only — independent of migration name/timestamp."""
    content = "\n".join([schema_sql] + functions + policies + indexes)
    return hashlib.sha256(content.encode()).hexdigest()


def _write_checksum(checksum: str, filename: str) -> None:
    """Write ``<checksum> <filename>`` to the checksum file.

    Binding the checksum to the migration filename means ``cmd_check`` can
    verify not only that the models are unchanged, but also that the migration
    file that was generated for that schema snapshot is actually present in the
    repository.  This prevents the "commit the snapshot but not the SQL" bypass.
    """
    CHECKSUM_FILE.write_text(f"{checksum} {filename}", encoding="utf-8")


def _read_checksum() -> tuple[str, str]:
    """Read the stored checksum and its bound filename.

    Returns (checksum, filename).  For legacy files that contain only a bare
    hash (no space-separated filename), filename is returned as an empty string.
    """
    raw = CHECKSUM_FILE.read_text(encoding="utf-8").strip()
    parts = raw.split(" ", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    # Legacy format — bare hash, no filename binding
    return parts[0], ""


def _file_checksum(path: Path) -> str:
    """SHA-256 of a file's contents, used for the migrations tracking table."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ---------------------------------------------------------------------------
# Schema snapshot helpers (used for incremental diff)
# ---------------------------------------------------------------------------


def _parse_create_table_blocks(schema_sql: str) -> dict[str, str]:
    """Extract a mapping of table_name → CREATE TABLE ... ; block from DDL.

    Each block is everything from ``CREATE TABLE`` up to and including the
    closing ``);`` (the Tortoise generator always ends table blocks with ``);``).
    Inline ``CREATE INDEX`` statements that follow the table are NOT included
    here — they're handled separately via the index extractor.
    """
    tables: dict[str, str] = {}
    # Match CREATE TABLE [IF NOT EXISTS] "name" ( ... );
    pattern = re.compile(
        r'(CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"?(\w+)"?\s*\(.*?\);)',
        re.DOTALL | re.IGNORECASE,
    )
    for m in pattern.finditer(schema_sql):
        block, name = m.group(1), m.group(2)
        tables[name] = block
    return tables


def _parse_columns(create_table_block: str) -> dict[str, str]:
    """Extract column definitions from a CREATE TABLE block.

    Returns {column_name: full_definition_line} for simple column lines
    (lines that start with ``"col_name"``).  Constraint lines are ignored.
    """
    columns: dict[str, str] = {}
    # Strip CREATE TABLE header and trailing );
    inner = re.sub(r"^CREATE TABLE.*?\(", "", create_table_block, count=1, flags=re.DOTALL)
    inner = re.sub(r"\);?\s*$", "", inner, flags=re.DOTALL)
    for raw_line in inner.splitlines():
        line = raw_line.strip().rstrip(",")
        if not line or line.upper().startswith("CONSTRAINT"):
            continue
        col_match = re.match(r'"(\w+)"\s+(.*)', line)
        if col_match:
            columns[col_match.group(1)] = line
    return columns


def _parse_index_names(schema_sql: str) -> set[str]:
    """Return all index names declared inline in the DDL."""
    return set(
        re.findall(
            r'CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+"?(\w+)"?',
            schema_sql,
            re.IGNORECASE,
        )
    )


def _build_incremental_sql(
    name: str,
    current_schema: str,
    previous_schema: str,
    policies: list[str],
    prev_policies: list[str],
    indexes: list[str],
    prev_indexes: list[str],
    functions: list[str],
    prev_functions: list[str],
) -> str:
    """Produce an incremental (ALTER / CREATE) migration from two schema snapshots.

    Detects:
    * New tables  → emitted as ``CREATE TABLE IF NOT EXISTS``
    * Dropped tables → emitted as ``DROP TABLE IF EXISTS`` (commented-out for safety;
      the developer must uncomment deliberately)
    * Added columns → ``ALTER TABLE ... ADD COLUMN IF NOT EXISTS``
    * Removed columns → commented-out ``ALTER TABLE ... DROP COLUMN``
    * New indexes → ``CREATE INDEX IF NOT EXISTS``
    * Removed indexes → commented-out ``DROP INDEX IF EXISTS``
    * Policy changes → full DROP + CREATE block (only if changed)
    * Function changes → full DROP + CREATE block (only if changed)
    """
    current_tables = _parse_create_table_blocks(current_schema)
    previous_tables = _parse_create_table_blocks(previous_schema)
    current_indexes = _parse_index_names(current_schema)
    previous_indexes = _parse_index_names(previous_schema)

    lines: list[str] = [
        f"-- Migration: {name}",
        f"-- Generated: {datetime.now(UTC).isoformat()}",
        "-- Type: incremental",
        "",
    ]

    schema_lines: list[str] = []

    # New tables
    for table, block in current_tables.items():
        if table not in previous_tables:
            schema_lines.append(f"-- New table: {table}")
            # Ensure IF NOT EXISTS is present
            safe_block = re.sub(
                r"CREATE TABLE\s+",
                "CREATE TABLE IF NOT EXISTS ",
                block,
                count=1,
                flags=re.IGNORECASE,
            )
            safe_block = re.sub(
                r"CREATE TABLE IF NOT EXISTS IF NOT EXISTS",
                "CREATE TABLE IF NOT EXISTS",
                safe_block,
                flags=re.IGNORECASE,
            )
            schema_lines.append(safe_block)

    # Dropped tables (commented-out for safety)
    for table in previous_tables:
        if table not in current_tables:
            schema_lines.append(f"-- Dropped table: {table}")
            schema_lines.append(f"-- DROP TABLE IF EXISTS public.{table} CASCADE;")
            schema_lines.append("-- Uncomment the line above to apply this destructive change.")

    # Column changes on existing tables
    for table in current_tables:
        if table not in previous_tables:
            continue  # already handled as new table
        current_cols = _parse_columns(current_tables[table])
        previous_cols = _parse_columns(previous_tables[table])

        added = {c: d for c, d in current_cols.items() if c not in previous_cols}
        removed = {c for c in previous_cols if c not in current_cols}

        for _col, defn in added.items():
            schema_lines.append(f"ALTER TABLE public.{table} ADD COLUMN IF NOT EXISTS {defn};")

        for col in removed:
            schema_lines.append(f"-- Removed column {col!r} from {table}")
            schema_lines.append(f'-- ALTER TABLE public.{table} DROP COLUMN IF EXISTS "{col}";')
            schema_lines.append("-- Uncomment the line above to apply this destructive change.")

    # New indexes (from Tortoise inline DDL)
    new_indexes = current_indexes - previous_indexes
    removed_inline_indexes = previous_indexes - current_indexes

    for idx in sorted(new_indexes):
        # Find the full CREATE INDEX statement in the current schema
        pattern = re.compile(
            rf'CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+"?{re.escape(idx)}"?[^\n]*',
            re.IGNORECASE,
        )
        m = pattern.search(current_schema)
        if m:
            stmt = m.group(0).rstrip(";") + ";"
            # Ensure IF NOT EXISTS
            if "IF NOT EXISTS" not in stmt.upper():
                stmt = re.sub(
                    r"(CREATE(?:\s+UNIQUE)?\s+INDEX)\s+",
                    r"\1 IF NOT EXISTS ",
                    stmt,
                    count=1,
                    flags=re.IGNORECASE,
                )
            schema_lines.append(stmt)

    for idx in sorted(removed_inline_indexes):
        schema_lines.append(f"-- Removed index {idx!r}")
        schema_lines.append(f'-- DROP INDEX IF EXISTS "{idx}";')
        schema_lines.append("-- Uncomment the line above to apply this destructive change.")

    if schema_lines:
        lines += [
            "-- Schema changes --------------------------------------------------------",
            "",
        ]
        lines += schema_lines

    # Functions & triggers (only re-emit if changed)
    new_functions = [f for f in functions if f not in prev_functions]
    if new_functions:
        lines += [
            "",
            "-- Functions & Triggers --------------------------------------------------",
            "",
        ]
        lines += [_idempotent_function_stmt(stmt) for stmt in new_functions]

    # Policies (only re-emit if changed)
    new_policies = [p for p in policies if p not in prev_policies]
    if new_policies:
        lines += [
            "",
            "-- Row Level Security ----------------------------------------------------",
            "",
        ]
        lines += [_idempotent_policy_stmt(stmt) for stmt in new_policies]

    # Extra custom indexes from Meta.sql_indexes
    prev_extra_set = set(prev_indexes)
    curr_extra_set = set(indexes)
    new_extra = curr_extra_set - prev_extra_set
    removed_extra = prev_extra_set - curr_extra_set

    extra_index_lines: list[str] = []
    for stmt in indexes:
        if stmt in new_extra:
            extra_index_lines.append(stmt.strip())
    for stmt in removed_extra:
        extra_index_lines.append(f"-- Removed custom index: {stmt.strip()[:60]}...")
        extra_index_lines.append("-- DROP INDEX IF EXISTS ... ; -- fill in manually")

    if extra_index_lines:
        lines += [
            "",
            "-- Custom Indexes --------------------------------------------------------",
            "",
        ]
        lines += extra_index_lines

    if not schema_lines and not new_extra and not removed_extra:
        lines += [
            "",
            "-- No structural schema changes detected.",
            "-- This migration contains only policy / function updates.",
        ]

    return "\n".join(lines) + "\n"


def _build_full_migration_sql(
    name: str,
    schema_sql: str,
    policies: list[str],
    indexes: list[str],
    functions: list[str],
) -> str:
    """Assemble a full (initial / squash) migration SQL string."""
    lines: list[str] = [
        f"-- Migration: {name}",
        f"-- Generated: {datetime.now(UTC).isoformat()}",
        "-- Type: full",
        "",
        "CREATE EXTENSION IF NOT EXISTS vector;",
        "",
        "-- Schema ----------------------------------------------------------------",
        "",
        schema_sql,
    ]

    if functions:
        lines += [
            "",
            "-- Functions & Triggers --------------------------------------------------",
            "",
        ]
        lines += [_idempotent_function_stmt(stmt) for stmt in functions]

    if policies:
        lines += [
            "",
            "-- Row Level Security ----------------------------------------------------",
            "",
        ]
        lines += [_idempotent_policy_stmt(stmt) for stmt in policies]

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


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


async def cmd_makemigrations(name: str, *, full: bool = False) -> None:
    """Generate a new timestamped Supabase migration file.

    Args:
        name: Short descriptive name for the migration (used in the filename).
        full: When True, generate a complete schema dump instead of an incremental diff.
    """
    print(f"Generating {'full' if full else 'incremental'} migration: {name}")

    schema_sql = await _generate_schema_sql()
    policies, indexes, functions = _collect_extras()

    MIGRATIONS_DIR.mkdir(parents=True, exist_ok=True)

    if full or not SNAPSHOT_FILE.exists():
        if not full and not SNAPSHOT_FILE.exists():
            print("No schema snapshot found — generating full migration.")
        migration_sql = _build_full_migration_sql(name, schema_sql, policies, indexes, functions)
    else:
        previous_schema = SNAPSHOT_FILE.read_text(encoding="utf-8")
        # Load previous extras from snapshot metadata (stored as a JSON-ish block comment)
        prev_policies, prev_indexes, prev_functions = _load_snapshot_extras()
        migration_sql = _build_incremental_sql(
            name,
            schema_sql,
            previous_schema,
            policies,
            prev_policies,
            indexes,
            prev_indexes,
            functions,
            prev_functions,
        )

    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{name}.sql"
    output_path = MIGRATIONS_DIR / filename

    output_path.write_text(migration_sql, encoding="utf-8")

    # Update snapshot and checksum — bind the checksum to this filename so
    # cmd_check can detect if the SQL file was not committed alongside the snapshot.
    SNAPSHOT_FILE.write_text(schema_sql, encoding="utf-8")
    _save_snapshot_extras(policies, indexes, functions)
    _write_checksum(_content_checksum(schema_sql, policies, indexes, functions), filename)

    print(f"Created:  supabase/migrations/{filename}")

    # Warn when the migration contains no structural DDL changes — this usually
    # means it was generated unnecessarily (e.g. to refresh policies only).
    # It is not blocked because policy-only migrations are sometimes intentional.
    has_structural = any(
        keyword in migration_sql.upper()
        for keyword in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "CREATE INDEX", "DROP INDEX")
    )
    if not has_structural:
        print(
            "WARNING: This migration contains no structural schema changes (no CREATE/ALTER/DROP TABLE or INDEX)."
        )
        print("If this was unintentional, delete the file and do not commit it.")

    print("Review it, then run:  supabase db push  (or: python manage.py migrate for local dev)")


def _snapshot_extras_file() -> Path:
    return MIGRATIONS_DIR / ".snapshot_extras"


def _save_snapshot_extras(policies: list[str], indexes: list[str], functions: list[str]) -> None:
    """Persist extra SQL lists alongside the schema snapshot."""
    import json

    _snapshot_extras_file().write_text(
        json.dumps({"policies": policies, "indexes": indexes, "functions": functions}, indent=2),
        encoding="utf-8",
    )


def _load_snapshot_extras() -> tuple[list[str], list[str], list[str]]:
    """Load previously saved extras.  Returns empty lists if not found."""
    import json

    extras_file = _snapshot_extras_file()
    if not extras_file.exists():
        return [], [], []
    data = json.loads(extras_file.read_text(encoding="utf-8"))
    return data.get("policies", []), data.get("indexes", []), data.get("functions", [])


async def cmd_check() -> None:
    """Exit with code 1 if models have changed since the last migration, or if
    the migration SQL file bound to the last checksum is missing from the repo.

    Two failure modes are caught:
    1. Model drift — models were edited without running ``makemigrations``.
    2. Missing SQL file — ``makemigrations`` was run and the snapshot committed,
       but the generated ``.sql`` file was not committed alongside it.

    Used by the CI pipeline; no database required.
    """
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

    # Verify the SQL file that was generated for this snapshot is present.
    if bound_filename and not (MIGRATIONS_DIR / bound_filename).exists():
        print(f"ERROR: Migration file '{bound_filename}' is recorded in .last_checksum")
        print("but does not exist in supabase/migrations/.")
        print("Ensure you commit the .sql file together with the snapshot files.")
        sys.exit(1)

    print("OK: Models match the last generated migration.")


def _get_db_url() -> str:
    """Return DATABASE_URL from the environment, or abort."""
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url or db_url == _ENV_STUBS["DATABASE_URL"]:
        print("ERROR: DATABASE_URL is not set. Export it or add it to backend/.env")
        sys.exit(1)
    return db_url


def _psql_run(db_url: str, sql: str) -> None:
    """Execute an arbitrary SQL string via psql, aborting on failure."""
    result = subprocess.run(
        ["psql", db_url, "-c", sql],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


def _psql_run_file(db_url: str, path: Path) -> None:
    """Execute a SQL file via psql, aborting on failure."""
    result = subprocess.run(
        ["psql", db_url, "-f", str(path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)


def _get_applied_migrations(db_url: str) -> set[str]:
    """Query the schema_migrations table and return the set of applied filenames."""
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
        # Table doesn't exist yet — that's fine, migrate will create it
        return set()
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


def _record_migration(db_url: str, name: str, checksum: str) -> None:
    """Insert a row into schema_migrations to mark a file as applied.

    Uses psql ``--set`` variable substitution so that the name and checksum
    values are always passed as quoted literals — never interpolated into SQL.
    """
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


def cmd_migrate() -> None:
    """Apply all pending migrations via psql, tracking applied files.

    On the first run, creates the ``schema_migrations`` tracking table.
    Subsequent runs skip any files that are already recorded in that table,
    making the command fully incremental and safe to re-run at any time.

    Requires DATABASE_URL to be set in the environment (or .env file).
    """
    db_url = _get_db_url()

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print("No migration files found in supabase/migrations/")
        sys.exit(0)

    # Ensure the tracking table exists
    print("Ensuring schema_migrations tracking table exists...")
    _psql_run(db_url, _CREATE_TRACKING_TABLE_SQL)

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
    """Show which migration files have and have not been applied.

    Requires DATABASE_URL to be set in the environment (or .env file).
    """
    db_url = _get_db_url()

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print("No migration files found in supabase/migrations/")
        return

    # Ensure tracking table exists before querying it
    _psql_run(db_url, _CREATE_TRACKING_TABLE_SQL)
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
        # Separate positional name from flags
        flags = [a for a in args[1:] if a.startswith("--")]
        positional = [a for a in args[1:] if not a.startswith("--")]
        if not positional:
            print("Usage: python manage.py makemigrations <name> [--full]")
            sys.exit(1)
        migration_name = positional[0]
        is_full = "--full" in flags
        asyncio.run(cmd_makemigrations(migration_name, full=is_full))

    elif command == "check":
        asyncio.run(cmd_check())

    elif command == "migrate":
        cmd_migrate()

    elif command == "status":
        cmd_status()

    else:
        print(f"Unknown command: {command!r}")
        print("Available commands: makemigrations, check, migrate, status")
        sys.exit(1)
