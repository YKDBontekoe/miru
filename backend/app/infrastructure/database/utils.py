"""Database utilities and helpers."""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import HTTPException
from tortoise.exceptions import DBConnectionError, IntegrityError, OperationalError

logger = logging.getLogger(__name__)


@asynccontextmanager
async def handle_db_errors(action: str) -> AsyncGenerator[None, None]:
    """Encapsulate repetitive database error handling globally.

    Args:
        action (str): Description of the action (e.g., "create task").
    """
    try:
        yield
    except HTTPException:
        raise
    except ValueError as e:
        logger.exception(f"Validation error while {action}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except (IntegrityError, OperationalError, DBConnectionError) as e:
        # Catch foreign key constraints and return 400 Bad Request to avoid Sentry noise
        if isinstance(e, IntegrityError) and (
            "FOREIGN KEY constraint failed" in str(e) or "violates foreign key constraint" in str(e)
        ):
            logger.warning("Validation error (foreign key) while %s: %s", action, e)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_reference",
                    "message": "Provided reference (e.g., agent or message) does not exist.",
                },
            ) from e

        logger.exception("Failed to %s", action)

        parts = action.split(" ", 1)
        verb = parts[0].lower()

        gerund_map = {
            "create": "creating",
            "list": "listing",
            "update": "updating",
            "delete": "deleting",
            "get": "getting",
        }

        if verb in gerund_map:
            gerund = gerund_map[verb]
        else:
            gerund = verb[:-1] + "ing" if verb.endswith("e") else verb + "ing"

        action_ing = f"{gerund} {parts[1]}" if len(parts) > 1 else gerund

        raise HTTPException(
            status_code=500, detail=f"Database error occurred while {action_ing}"
        ) from e
    except Exception as e:
        method_name = action.replace(" ", "_")
        logger.exception(f"Unexpected error in {method_name}")
        raise HTTPException(status_code=500, detail=f"Failed to {action}") from e
