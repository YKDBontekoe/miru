"""Migration CLI — the 'dotnet ef' equivalent for Miru.

Usage
-----
    python manage.py makemigrations <name>   Generate an incremental Supabase SQL migration
    python manage.py makemigrations <name> --full
                                             Generate a full-schema migration (initial / squash)
    python manage.py migrate                 Apply pending migrations (tracks applied files)
    python manage.py check                   Exit 1 if models differ from last migration
    python manage.py status                  Show which migrations have / have not been applied
"""

from __future__ import annotations

import asyncio
import sys

# Apply env stubs before importing Pydantic Settings
from app.infrastructure.database.migrations.constants import apply_env_stubs

apply_env_stubs()

# fmt: off
from app.infrastructure.database.migrations.generator import \
    cmd_makemigrations  # noqa: E402
from app.infrastructure.database.migrations.runner import (  # noqa: E402
    cmd_check, cmd_migrate, cmd_status)

# fmt: on

if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(0)

    command = args[0]

    if command == "makemigrations":
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
