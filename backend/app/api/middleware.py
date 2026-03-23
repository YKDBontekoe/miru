"""Middleware for audit logging."""

import logging
from collections.abc import Awaitable, Callable
from uuid import UUID

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.domain.auth.models import AuditLog

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # Process the request first so we don't hold up execution, or we can log before.
        # Let's log before.
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                from app.domain.auth.service import AuthService
                from app.infrastructure.database.supabase import get_supabase
                from app.infrastructure.repositories.auth_repo import AuthRepository

                # Manually instantiate the service for middleware
                db = get_supabase()
                repo = AuthRepository(db)
                service = AuthService(repo)

                # Decode JWT using AuthService to guarantee full signature verification
                payload = await service.decode_jwt(token)

                user_id_str = str(payload.sub)
                if user_id_str:
                    action = request.method
                    resource = str(request.url.path)

                    # Create audit log asynchronously.
                    await AuditLog.create(
                        user_id=UUID(user_id_str), action=action, resource=resource
                    )
            except Exception as e:
                # If decoding fails or user_id is invalid, we just skip logging and let
                # the actual auth dependency fail the request.
                logger.debug(f"Audit log skip: {e}")
                pass

        response = await call_next(request)
        return response
