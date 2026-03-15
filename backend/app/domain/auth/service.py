"""Auth service for business logic and WebAuthn passkey orchestration."""

from __future__ import annotations

import base64
import json
import logging
import os
import secrets
from typing import TYPE_CHECKING, Any
from uuid import UUID

import jwt
import webauthn
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from app.core.config import get_settings
from app.domain.auth.models import JWTPayload

if TYPE_CHECKING:
    from app.infrastructure.repositories.auth_repo import AuthRepository

logger = logging.getLogger(__name__)

# In-memory challenge store (use Redis in production for horizontal scaling)
_challenge_store: dict[str, str] = {}


def _store_challenge(challenge_id: str, challenge: str) -> None:
    _challenge_store[challenge_id] = challenge


def _pop_challenge(challenge_id: str) -> str | None:
    return _challenge_store.pop(challenge_id, None)


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

    async def decode_jwt(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT."""
        settings = get_settings()
        try:
            try:
                header = jwt.get_unverified_header(token)
            except Exception as header_exc:
                raise jwt.DecodeError("Invalid token format") from header_exc

            alg = header.get("alg")

            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            else:
                jwks_client = self._get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )
            return JWTPayload(**payload)
        except Exception as exc:
            logger.error("JWT validation failed: %s", exc)
            raise

    # --- WebAuthn / Passkey Logic ---

    def _rp_settings(self) -> tuple[str, str, str]:
        settings = get_settings()
        return settings.webauthn_rp_id, settings.webauthn_rp_name, settings.webauthn_expected_origin

    async def get_registration_options(
        self, user_id: UUID, username: str, device_name: str | None = None
    ) -> dict[str, Any]:
        """Generate WebAuthn registration options and store challenge."""
        rp_id, rp_name, _ = self._rp_settings()

        existing_passkeys = await self.repo.get_passkeys_by_user(user_id)
        exclude_credentials = [
            PublicKeyCredentialDescriptor(id=base64.urlsafe_b64decode(pk.credential_id + "=="))
            for pk in existing_passkeys
        ]

        options = webauthn.generate_registration_options(
            rp_id=rp_id,
            rp_name=rp_name,
            user_id=str(user_id).encode(),
            user_name=username,
            user_display_name=device_name or username,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
            exclude_credentials=exclude_credentials,
        )

        challenge_id = secrets.token_urlsafe(16)
        _store_challenge(challenge_id, base64.b64encode(options.challenge).decode())

        return {
            "challenge_id": challenge_id,
            **json.loads(webauthn.options_to_json(options)),
        }

    async def verify_registration(
        self,
        challenge_id: str,
        credential_json: str,
        user_id: UUID,
        device_name: str | None = None,
    ) -> None:
        """Verify a WebAuthn registration response and store the credential."""
        rp_id, _, expected_origin = self._rp_settings()

        challenge_b64 = _pop_challenge(challenge_id)
        if not challenge_b64:
            raise ValueError("Challenge not found or expired")
        expected_challenge = base64.b64decode(challenge_b64)

        verification = webauthn.verify_registration_response(
            credential=webauthn.parse_registration_credential_json(credential_json),
            expected_challenge=expected_challenge,
            expected_rp_id=rp_id,
            expected_origin=expected_origin,
            require_user_verification=False,
        )

        credential_id = base64.urlsafe_b64encode(verification.credential_id).decode().rstrip("=")
        public_key = base64.b64encode(verification.credential_public_key).decode()

        await self.repo.create_passkey({
            "user_id": str(user_id),
            "credential_id": credential_id,
            "public_key": public_key,
            "sign_count": verification.sign_count,
            "device_name": device_name,
            "transports": [],
        })

    async def get_login_options(self, email: str) -> dict[str, Any]:
        """Generate WebAuthn authentication options."""
        rp_id, _, _ = self._rp_settings()

        challenge_id = secrets.token_urlsafe(16)
        options = webauthn.generate_authentication_options(
            rp_id=rp_id,
            user_verification=UserVerificationRequirement.PREFERRED,
        )

        _store_challenge(challenge_id, base64.b64encode(options.challenge).decode())

        return {
            "challenge_id": challenge_id,
            **json.loads(webauthn.options_to_json(options)),
        }

    async def verify_login(
        self,
        challenge_id: str,
        credential_json: str,
    ) -> dict[str, str]:
        """Verify a WebAuthn login assertion and return Supabase tokens."""
        rp_id, _, expected_origin = self._rp_settings()

        challenge_b64 = _pop_challenge(challenge_id)
        if not challenge_b64:
            raise ValueError("Challenge not found or expired")
        expected_challenge = base64.b64decode(challenge_b64)

        # Parse credential to get credential_id for lookup
        cred = webauthn.parse_authentication_credential_json(credential_json)
        credential_id = base64.urlsafe_b64encode(cred.raw_id).decode().rstrip("=")

        # Look up the passkey
        settings = get_settings()
        rows = (
            self.repo.db.table("passkeys")
            .select("*, profiles!inner(id)")
            .eq("credential_id", credential_id)
            .execute()
        )
        if not rows.data:
            raise ValueError("Passkey not found")

        passkey_row = rows.data[0]
        stored_public_key = base64.b64decode(passkey_row["public_key"])
        stored_sign_count = passkey_row["sign_count"]
        passkey_id = passkey_row["id"]
        user_id = passkey_row["user_id"]

        verification = webauthn.verify_authentication_response(
            credential=cred,
            expected_challenge=expected_challenge,
            expected_rp_id=rp_id,
            expected_origin=expected_origin,
            credential_public_key=stored_public_key,
            credential_current_sign_count=stored_sign_count,
            require_user_verification=False,
        )

        # Update sign count
        await self.repo.update_sign_count(passkey_id, verification.new_sign_count)

        # Mint a Supabase session using the service role key
        from supabase import create_client
        admin_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        session = admin_client.auth.admin.generate_link({
            "type": "magiclink",
            "email": passkey_row.get("email", f"{user_id}@passkey.local"),
        })

        return {
            "access_token": session.properties.access_token if hasattr(session, "properties") else "",
            "refresh_token": session.properties.refresh_token if hasattr(session, "properties") else "",
            "user_id": str(user_id),
        }

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        return await self.repo.delete_passkey(passkey_id, user_id)
