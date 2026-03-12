"""Auth service for business logic and WebAuthn orchestration."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

import jwt
from app.infrastructure.repositories.auth_repo import AuthRepository
from app.core.config import get_settings
# Assume other helpers from passkey.py are imported or refactored here

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, repo: AuthRepository):
        self.repo = repo
        self._jwks_client: jwt.PyJWKClient | None = None

    def _get_jwks_client(self) -> jwt.PyJWKClient:
        if self._jwks_client is None:
            settings = get_settings()
            jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
            self._jwks_client = jwt.PyJWKClient(jwks_url)
        return self._jwks_client

    async def decode_jwt(self, token: str) -> dict[str, Any]:
        """Decode and verify a Supabase JWT."""
        settings = get_settings()
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            payload = jwt.decode(
                token, settings.supabase_jwt_secret, 
                algorithms=["HS256"], options={"verify_aud": False}
            )
        else:
            jwks_client = self._get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token, signing_key.key, 
                algorithms=["ES256", "RS256"], options={"verify_aud": False}
            )
        return payload

    # WebAuthn logic here...
    # generate_registration_options, verify_registration, etc.
    # Refactored from passkey.py to use self.repo for DB calls
