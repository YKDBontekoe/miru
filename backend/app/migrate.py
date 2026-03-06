"""CLI commands for database migrations.

Usage:
    python -m app.migrate upgrade     # Run all pending migrations
    python -m app.migrate downgrade   # Rollback last migration
    python -m app.migrate current     # Show current revision
    python -m app.migrate history     # Show migration history
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

# Add parent directory to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


def run_alembic_command(args: list[str]) -> int:
    """Run an alembic command with the given arguments."""
    cmd = ["alembic"] + args
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False, text=True)
    return result.returncode


def upgrade(revision: str = "head") -> int:
    """Upgrade database to the given revision."""
    return run_alembic_command(["upgrade", revision])


def downgrade(revision: str = "-1") -> int:
    """Downgrade database by the given number of revisions."""
    return run_alembic_command(["downgrade", revision])


def current() -> int:
    """Show current database revision."""
    return run_alembic_command(["current"])


def history() -> int:
    """Show migration history."""
    return run_alembic_command(["history", "--verbose"])


def create_migration(message: str) -> int:
    """Create a new migration with the given message."""
    return run_alembic_command(["revision", "--autogenerate", "-m", message])


def main() -> int:
    """Main entry point for migration CLI."""
    parser = argparse.ArgumentParser(
        description="Database migration management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m app.migrate upgrade           # Upgrade to latest
  python -m app.migrate upgrade 001       # Upgrade to specific revision
  python -m app.migrate downgrade         # Rollback one revision
  python -m app.migrate current           # Show current version
  python -m app.migrate history           # Show all migrations
  python -m app.migrate create "add users table"  # Create new migration
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Upgrade command
    upgrade_parser = subparsers.add_parser("upgrade", help="Upgrade database")
    upgrade_parser.add_argument(
        "revision", nargs="?", default="head", help="Target revision (default: head)"
    )

    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade database")
    downgrade_parser.add_argument(
        "revision", nargs="?", default="-1", help="Number of revisions to rollback (default: -1)"
    )

    # Current command
    subparsers.add_parser("current", help="Show current revision")

    # History command
    subparsers.add_parser("history", help="Show migration history")

    # Create migration command
    create_parser = subparsers.add_parser("create", help="Create new migration")
    create_parser.add_argument("message", help="Migration description")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Change to backend directory for alembic
    import os

    os.chdir(backend_dir)

    if args.command == "upgrade":
        return upgrade(args.revision)
    elif args.command == "downgrade":
        return downgrade(args.revision)
    elif args.command == "current":
        return current()
    elif args.command == "history":
        return history()
    elif args.command == "create":
        return create_migration(args.message)

    return 0


if __name__ == "__main__":
    sys.exit(main())
