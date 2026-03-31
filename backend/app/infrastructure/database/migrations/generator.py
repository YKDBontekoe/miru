"""Schema generation and diffing for migrations."""

from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, cast

from app.infrastructure.database.migrations.constants import (
    ALL_MODEL_MODULES,
    CHECKSUM_FILE,
    MIGRATIONS_DIR,
    SEED_SQL,
    SNAPSHOT_FILE,
)

if TYPE_CHECKING:
    from tortoise.backends.asyncpg.client import AsyncpgDBClient

# ---------------------------------------------------------------------------
# Core: schema generation
# ---------------------------------------------------------------------------


async def _generate_schema_sql() -> str:
    from tortoise import Tortoise
    from tortoise.backends.asyncpg.schema_generator import AsyncpgSchemaGenerator

    await Tortoise.init(
        db_url="sqlite://:memory:",
        modules={"models": ALL_MODEL_MODULES},
    )
    conn = cast("AsyncpgDBClient", Tortoise.get_connection("default"))
    sql = AsyncpgSchemaGenerator(conn).get_create_schema_sql()
    await Tortoise.close_connections()
    return sql.replace('"embedding" JSONB', '"embedding" vector(1536)')


def _collect_extras() -> tuple[list[str], list[str], list[str]]:
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
    meta = getattr(cls, "Meta", None)
    if meta and not getattr(meta, "abstract", False):
        policies.extend(getattr(meta, "sql_policies", []))
        indexes.extend(getattr(meta, "sql_indexes", []))
        functions.extend(getattr(meta, "sql_functions", []))
    for sub in cls.__subclasses__():
        _walk_subclass(sub, policies, indexes, functions)


def _idempotent_policy_stmt(stmt: str) -> str:
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
    content = "\n".join([schema_sql] + functions + policies + indexes)
    return hashlib.sha256(content.encode()).hexdigest()


def _write_checksum(checksum: str, filename: str) -> None:
    CHECKSUM_FILE.write_text(f"{checksum} {filename}", encoding="utf-8")


def _read_checksum() -> tuple[str, str]:
    raw = CHECKSUM_FILE.read_text(encoding="utf-8").strip()
    parts = raw.split(" ", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return parts[0], ""


def _file_checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ---------------------------------------------------------------------------
# Schema snapshot helpers
# ---------------------------------------------------------------------------


def _parse_create_table_blocks(schema_sql: str) -> dict[str, str]:
    tables: dict[str, str] = {}
    pattern = re.compile(
        r'(CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"?(\w+)"?\s*\(.*?\);)',
        re.DOTALL | re.IGNORECASE,
    )
    for m in pattern.finditer(schema_sql):
        block, name = m.group(1), m.group(2)
        tables[name] = block
    return tables


def _parse_columns(create_table_block: str) -> dict[str, str]:
    columns: dict[str, str] = {}
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

    for table, block in current_tables.items():
        if table not in previous_tables:
            schema_lines.append(f"-- New table: {table}")
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

    for table in previous_tables:
        if table not in current_tables:
            schema_lines.append(f"-- Dropped table: {table}")
            schema_lines.append(f"-- DROP TABLE IF EXISTS public.{table} CASCADE;")
            schema_lines.append("-- Uncomment the line above to apply this destructive change.")

    for table in current_tables:
        if table not in previous_tables:
            continue
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

    new_indexes = current_indexes - previous_indexes
    removed_inline_indexes = previous_indexes - current_indexes

    for idx in sorted(new_indexes):
        pattern = re.compile(
            rf'CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+"?{re.escape(idx)}"?[^\n]*',
            re.IGNORECASE,
        )
        m = pattern.search(current_schema)
        if m:
            stmt = m.group(0).rstrip(";") + ";"
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

    new_functions = [f for f in functions if f not in prev_functions]
    if new_functions:
        lines += [
            "",
            "-- Functions & Triggers --------------------------------------------------",
            "",
        ]
        lines += [_idempotent_function_stmt(stmt) for stmt in new_functions]

    new_policies = [p for p in policies if p not in prev_policies]
    if new_policies:
        lines += [
            "",
            "-- Row Level Security ----------------------------------------------------",
            "",
        ]
        lines += [_idempotent_policy_stmt(stmt) for stmt in new_policies]

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


def _snapshot_extras_file() -> Path:
    return MIGRATIONS_DIR / ".snapshot_extras"


def _save_snapshot_extras(policies: list[str], indexes: list[str], functions: list[str]) -> None:
    import json

    _snapshot_extras_file().write_text(
        json.dumps({"policies": policies, "indexes": indexes, "functions": functions}, indent=2),
        encoding="utf-8",
    )


def _load_snapshot_extras() -> tuple[list[str], list[str], list[str]]:
    import json

    extras_file = _snapshot_extras_file()
    if not extras_file.exists():
        return [], [], []
    data = json.loads(extras_file.read_text(encoding="utf-8"))
    return data.get("policies", []), data.get("indexes", []), data.get("functions", [])


async def cmd_makemigrations(name: str, *, full: bool = False) -> None:
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

    SNAPSHOT_FILE.write_text(schema_sql, encoding="utf-8")
    _save_snapshot_extras(policies, indexes, functions)
    _write_checksum(_content_checksum(schema_sql, policies, indexes, functions), filename)

    print(f"Created:  supabase/migrations/{filename}")

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
