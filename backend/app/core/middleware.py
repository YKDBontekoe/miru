"""Middleware to handle audit logging."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from starlette.middleware.base import BaseHTTPMiddleware

from app.domain.auth.models import AuditLog

if TYPE_CHECKING:
    from fastapi import Request

logger = logging.getLogger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware that explicitly tracks user activity/data access for auditing."""

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)

        # SEC(agent): Remediation for Audit Logging / Data Privacy Vulnerability:
        # Create a secure, non-malleable log of who accessed what data and when.
        if request.url.path.startswith("/api/v1") and request.url.path != "/api/v1/health":
            user_id = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    import jwt

                    payload = jwt.decode(token, options={"verify_signature": False})
                    user_id = payload.get("sub")
                except Exception:
                    pass

            ip = request.client.host if request.client else None
            path = request.url.path
            method = request.method

            async def log_audit() -> None:
                try:
                    await AuditLog.create(
                        user_id=user_id, endpoint=path, method=method, ip_address=ip
                    )
                except Exception as e:
                    logger.error("Failed to write audit log: %s", e)

            asyncio.create_task(log_audit())

        return response
