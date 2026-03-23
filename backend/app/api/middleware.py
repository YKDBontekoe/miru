from __future__ import annotations

"""Middleware for audit logging."""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from uuid import UUID

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.domain.auth.models import AuditLog

logger = logging.getLogger(__name__)

async def _write_audit(user_id_str: str, action: str, resource: str) -> None:
    try:
        await AuditLog.create(
            user_id=UUID(user_id_str), action=action, resource=resource
        )
    except Exception:
        logger.exception("Failed to write audit log to database")


class AuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *args, **kwargs):
        super().__init__(app, *args, **kwargs)
        from app.domain.auth.service import AuthService
        from app.infrastructure.database.supabase import get_supabase
        from app.infrastructure.repositories.auth_repo import AuthRepository

        # Manually instantiate the service once for middleware
        db = get_supabase()
        repo = AuthRepository(db)
        self.auth_service = AuthService(repo)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        # Process the request first so we don't hold up execution, or we can log before.
        # Let's log before.
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # Decode JWT using AuthService to guarantee full signature verification
                payload = await self.auth_service.decode_jwt(token)

                user_id_str = str(payload.sub)
                if user_id_str:
                    action = request.method
                    resource = str(request.url.path)

                    # Create audit log asynchronously off the hot path
                    asyncio.create_task(_write_audit(user_id_str, action, resource))
            except (ValueError, TypeError, Exception) as e:
                # If decoding fails or user_id is invalid, we just skip logging and let
                # the actual auth dependency fail the request.
                pass

        return await call_next(request)
