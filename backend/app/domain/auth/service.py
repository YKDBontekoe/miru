"""Auth service for business logic and WebAuthn orchestration."""

from __future__ import annotations

import base64
import json
import logging
import secrets
import time
from typing import TYPE_CHECKING, Any

import jwt
import webauthn
from webauthn.helpers import bytes_to_base64url
from webauthn.helpers.structs import PublicKeyCredentialDescriptor

from app.core.config import get_settings

if TYPE_CHECKING:
    from uuid import UUID

    from app.infrastructure.repositories.auth_repo import AuthRepository

logger = logging.getLogger(__name__)

_CHALLENGE_TTL_SECONDS = 300
_challenge_store: dict[str, dict[str, Any]] = {}

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
        try:
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
        except Exception as exc:
            logger.error("JWT validation failed: %s", exc)
            raise

    # --- WebAuthn / Passkey Logic ---

    def _store_challenge(self, challenge_bytes: bytes, user_id: str | None = None) -> str:
        self._evict_expired_challenges()
        challenge_id = secrets.token_urlsafe(32)
        _challenge_store[challenge_id] = {
            "challenge": challenge_bytes,
            "user_id": user_id,
            "expires_at": time.time() + _CHALLENGE_TTL_SECONDS,
        }
        return challenge_id

    def _pop_challenge(self, challenge_id: str) -> dict[str, Any]:
        entry = _challenge_store.pop(challenge_id, None)
        self._evict_expired_challenges()
        if entry is None:
            raise ValueError("Challenge not found or already used")
        if time.time() > entry["expires_at"]:
            raise ValueError("Challenge has expired")
        return entry

    def _evict_expired_challenges(self) -> None:
        now = time.time()
        expired = [k for k, v in _challenge_store.items() if now > v["expires_at"]]
        for k in expired:
            del _challenge_store[k]

    def generate_registration_options(
        self, user_id: UUID, user_email: str, existing_passkeys: list[dict[str, Any]]
    ) -> dict[str, Any]:
        settings = get_settings()
        exclude = [
            PublicKeyCredentialDescriptor(id=self._decode_credential_id(p["credential_id"]))
            for p in existing_passkeys
        ]
        options = webauthn.generate_registration_options(
            rp_id=settings.webauthn_rp_id,
            rp_name=settings.webauthn_rp_name,
            user_id=str(user_id).encode(),
            user_name=user_email,
            user_display_name=user_email,
            exclude_credentials=exclude,
        )
        challenge_id = self._store_challenge(options.challenge, user_id=str(user_id))
        return {
            "challenge_id": challenge_id,
            "options": json.loads(webauthn.options_to_json(options)),
        }

    async def verify_and_store_registration(
        self, challenge_id: str, credential_json: str, device_name: str | None
    ) -> dict[str, Any]:
        settings = get_settings()
        entry = self._pop_challenge(challenge_id)

        try:
            verification = webauthn.verify_registration_response(
                credential=credential_json,
                expected_challenge=entry["challenge"],
                expected_rp_id=settings.webauthn_rp_id,
                expected_origin=settings.webauthn_expected_origin.split(","),
            )
        except Exception as exc:
            raise ValueError(f"Passkey registration verification failed: {exc}")

        row = {
            "user_id": entry["user_id"],
            "credential_id": bytes_to_base64url(verification.credential_id),
            "public_key": bytes_to_base64url(verification.credential_public_key),
            "sign_count": verification.sign_count,
            "transports": list(verification.credential_device_type.value) if verification.credential_device_type else [],
            "device_name": device_name,
        }
        return await self.repo.create_passkey(row)

    async def generate_authentication_options(self, user_email: str) -> dict[str, Any]:
        get_settings()
        # This requires an admin client to look up user by email, or a repository method
        # For now, we'll assume the repository can handle user lookup or we pass the admin client
        # (Simplified for this refactor)
        raise NotImplementedError("Authentication options logic needs user lookup integration")

    def _decode_credential_id(self, value: Any) -> bytes:
        if isinstance(value, bytes): return value
        if isinstance(value, str):
            if value.startswith("\\x"): return bytes.fromhex(value[2:])
            try: return base64.urlsafe_b64decode(value + "==")
            except Exception: return value.encode()
        if isinstance(value, list): return bytes(value)
        raise TypeError(f"Cannot decode credential ID from {type(value)}")
