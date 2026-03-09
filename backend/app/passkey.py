"""WebAuthn / passkey support for Miru.

This module handles the full WebAuthn registration and authentication ceremonies:

Registration flow (called while the user is already authenticated via magic link):
  1. Client calls POST /api/auth/passkey/register/options
     → backend generates a PublicKeyCredentialCreationOptions challenge and stores
       it in _challenge_store keyed by a random challenge_id.
  2. Client creates the credential using navigator.credentials.create() (web) or
     the platform native API (iOS/Android) and sends the response back.
  3. Client calls POST /api/auth/passkey/register/verify with the credential.
     → backend verifies, stores the credential in the passkeys table.

Authentication flow (unauthenticated):
  1. Client calls POST /api/auth/passkey/login/options with the user's email.
     → backend looks up that user's passkey credential IDs and returns a
       PublicKeyCredentialRequestOptions challenge.
  2. Client signs the challenge with navigator.credentials.get() / platform API.
  3. Client calls POST /api/auth/passkey/login/verify with the assertion.
     → backend verifies the signature, updates sign_count, then mints a Supabase
       session via the Admin API and returns the access + refresh tokens.

Challenge storage:
  Challenges are stored in a simple in-memory dict (_challenge_store) with a TTL
  of 5 minutes.  This is sufficient for single-instance deployments.  For
  multi-instance setups, replace with Redis or a Supabase table.
"""

from __future__ import annotations

import base64
import logging
import secrets
import time
import urllib.parse
from typing import TYPE_CHECKING, Any, cast

import webauthn
from webauthn.helpers import bytes_to_base64url
from webauthn.helpers.exceptions import InvalidAuthenticatorDataStructure, InvalidCBORData
from webauthn.helpers.structs import (
    AuthenticationCredential,
    PublicKeyCredentialDescriptor,
    RegistrationCredential,
)

from app.config import get_settings
from app.database import get_supabase

if TYPE_CHECKING:
    from uuid import UUID

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Challenge store — keyed by challenge_id (random token), value is a dict
# containing the raw challenge bytes, the associated user_id (for auth), and
# the expiry unix timestamp.
# ---------------------------------------------------------------------------

_CHALLENGE_TTL_SECONDS = 300  # 5 minutes

_challenge_store: dict[str, dict[str, Any]] = {}


def _new_challenge_id() -> str:
    return secrets.token_urlsafe(32)


def _store_challenge(challenge_bytes: bytes, *, user_id: str | None = None) -> str:
    """Persist a challenge and return the challenge_id to pass to the client."""
    _evict_expired_challenges()
    challenge_id = _new_challenge_id()
    _challenge_store[challenge_id] = {
        "challenge": challenge_bytes,
        "user_id": user_id,
        "expires_at": time.time() + _CHALLENGE_TTL_SECONDS,
    }
    return challenge_id


def _pop_challenge(challenge_id: str) -> dict[str, Any]:
    """Retrieve and remove a challenge, raising ValueError if expired/missing."""
    # Pop first so we can check expiry on the specific entry.
    # (Eviction runs after so as not to remove the target before we can
    # report a meaningful error.)
    entry = _challenge_store.pop(challenge_id, None)
    _evict_expired_challenges()  # clean up other expired entries
    if entry is None:
        raise ValueError("Challenge not found or already used")
    if time.time() > entry["expires_at"]:
        raise ValueError("Challenge has expired")
    return entry


def _evict_expired_challenges() -> None:
    """Remove all expired challenges from the store."""
    now = time.time()
    expired = [k for k, v in _challenge_store.items() if now > v["expires_at"]]
    for k in expired:
        del _challenge_store[k]


# ---------------------------------------------------------------------------
# Registration helpers
# ---------------------------------------------------------------------------


def generate_registration_options(
    user_id: UUID,
    user_email: str,
    existing_credential_ids: list[bytes],
) -> dict[str, Any]:
    """Generate a PublicKeyCredentialCreationOptions dict for the client.

    Args:
        user_id: The authenticated Supabase user's UUID.
        user_email: The user's email (used as display name).
        existing_credential_ids: Raw credential ID bytes of passkeys already
            registered for this user (to populate excludeCredentials).

    Returns:
        A JSON-serialisable dict with ``challenge_id`` (opaque token to pass
        back to the verify endpoint) and ``options`` (the creation options to
        pass to navigator.credentials.create()).
    """
    settings = get_settings()
    user_id_bytes = str(user_id).encode()

    exclude = [PublicKeyCredentialDescriptor(id=cid) for cid in existing_credential_ids]

    options = webauthn.generate_registration_options(
        rp_id=settings.webauthn_rp_id,
        rp_name=settings.webauthn_rp_name,
        user_id=user_id_bytes,
        user_name=user_email,
        user_display_name=user_email,
        exclude_credentials=exclude,
    )

    challenge_id = _store_challenge(options.challenge, user_id=str(user_id))

    return {
        "challenge_id": challenge_id,
        "options": webauthn.options_to_json(options),
    }


def verify_registration(
    challenge_id: str,
    credential_json: str,
    device_name: str | None,
) -> dict[str, Any]:
    """Verify a registration response and return the data to persist.

    Args:
        challenge_id: The opaque token returned by generate_registration_options.
        credential_json: The JSON-encoded PublicKeyCredential from the client.
        device_name: Optional human-readable label (e.g. "Touch ID on MacBook").

    Returns:
        A dict with the fields to insert into the passkeys table.

    Raises:
        ValueError: If the challenge is invalid/expired or verification fails.
        webauthn.helpers.exceptions.InvalidCBORData: On malformed credential data.
    """
    settings = get_settings()

    entry = _pop_challenge(challenge_id)
    expected_challenge = entry["challenge"]
    user_id = entry["user_id"]

    try:
        credential = RegistrationCredential.parse_raw(credential_json)
        verification = webauthn.verify_registration_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_rp_id=settings.webauthn_rp_id,
            expected_origin=settings.webauthn_expected_origin.split(","),
        )
    except (InvalidCBORData, InvalidAuthenticatorDataStructure, Exception) as exc:
        raise ValueError(f"Passkey registration verification failed: {exc}") from exc

    return {
        "user_id": user_id,
        "credential_id": bytes(verification.credential_id),
        "public_key": bytes(verification.credential_public_key),
        "sign_count": verification.sign_count,
        "transports": (
            list(verification.credential_device_type.value)
            if verification.credential_device_type
            else []
        ),
        "device_name": device_name,
    }


# ---------------------------------------------------------------------------
# Authentication helpers
# ---------------------------------------------------------------------------


def generate_authentication_options(
    user_email: str,
) -> dict[str, Any]:
    """Generate a PublicKeyCredentialRequestOptions dict for the client.

    Looks up the user's registered passkeys from Supabase to populate
    ``allowCredentials``.

    Args:
        user_email: The email of the user wishing to authenticate.

    Returns:
        A JSON-serialisable dict with ``challenge_id`` and ``options``.
        Returns None for options.allowCredentials if no passkeys are found
        (which will result in a client-side error — the caller should handle
        this gracefully).

    Raises:
        ValueError: If the user has no registered passkeys.
    """
    settings = get_settings()
    supabase = get_supabase()

    # Look up the user's UUID by email via the admin API (service role).
    admin = _get_admin_client()
    users_response = admin.auth.admin.list_users()
    matching = [u for u in users_response if u.email == user_email]
    if not matching:
        # Don't reveal whether the user exists — raise generic error.
        raise ValueError("No passkeys registered for this account")

    user_id = str(matching[0].id)

    # Fetch their credential IDs.
    rows = (
        supabase.table("passkeys")
        .select("id, credential_id, transports")
        .eq("user_id", user_id)
        .execute()
    )
    passkey_rows = cast("list[dict[str, Any]]", rows.data)
    if not passkey_rows:
        raise ValueError("No passkeys registered for this account")

    allow_credentials = [
        PublicKeyCredentialDescriptor(
            id=(
                bytes(row["credential_id"])
                if isinstance(row["credential_id"], list)
                else _decode_credential_id(row["credential_id"])
            ),
            transports=row.get("transports") or [],
        )
        for row in passkey_rows
    ]

    options = webauthn.generate_authentication_options(
        rp_id=settings.webauthn_rp_id,
        allow_credentials=allow_credentials,
    )

    challenge_id = _store_challenge(options.challenge, user_id=user_id)

    return {
        "challenge_id": challenge_id,
        "options": webauthn.options_to_json(options),
    }


def verify_authentication(
    challenge_id: str,
    credential_json: str,
) -> dict[str, Any]:
    """Verify an authentication assertion and return Supabase session tokens.

    Args:
        challenge_id: The opaque token returned by generate_authentication_options.
        credential_json: The JSON-encoded PublicKeyCredential (assertion) from the client.

    Returns:
        A dict with ``access_token``, ``refresh_token``, ``expires_in``, and ``user``.

    Raises:
        ValueError: If verification fails.
    """
    settings = get_settings()
    supabase = get_supabase()

    entry = _pop_challenge(challenge_id)
    expected_challenge = entry["challenge"]
    user_id = entry["user_id"]

    if user_id is None:
        raise ValueError("Invalid challenge — no associated user")

    try:
        credential = AuthenticationCredential.parse_raw(credential_json)
    except Exception as exc:
        raise ValueError(f"Malformed credential: {exc}") from exc

    # Find the matching stored passkey by credential ID.
    raw_id = bytes(credential.raw_id)
    rows = (
        supabase.table("passkeys")
        .select("id, credential_id, public_key, sign_count, user_id")
        .eq("user_id", user_id)
        .execute()
    )
    passkey_rows = cast("list[dict[str, Any]]", rows.data)

    stored_row: dict[str, Any] | None = None
    for row in passkey_rows:
        stored_cred_id = (
            bytes(row["credential_id"])
            if isinstance(row["credential_id"], list)
            else _decode_credential_id(row["credential_id"])
        )
        if stored_cred_id == raw_id:
            stored_row = row
            break

    if stored_row is None:
        raise ValueError("Passkey credential not found for this user")

    stored_public_key = (
        bytes(stored_row["public_key"])
        if isinstance(stored_row["public_key"], list)
        else _decode_credential_id(stored_row["public_key"])
    )
    stored_sign_count = int(stored_row["sign_count"])

    try:
        verification = webauthn.verify_authentication_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_rp_id=settings.webauthn_rp_id,
            expected_origin=settings.webauthn_expected_origin.split(","),
            credential_public_key=stored_public_key,
            credential_current_sign_count=stored_sign_count,
        )
    except Exception as exc:
        raise ValueError(f"Passkey authentication verification failed: {exc}") from exc

    # Update sign_count to prevent replay attacks.
    supabase.table("passkeys").update(
        {
            "sign_count": verification.new_sign_count,
            "last_used_at": "now()",
        }
    ).eq("id", stored_row["id"]).execute()

    # Mint a Supabase session for the user via the Admin API.
    # We use generate_link to create a magic link token, then sign in with it.
    admin = _get_admin_client()
    link_response = admin.auth.admin.generate_link(
        {
            "type": "magiclink",
            "email": _get_user_email(admin, user_id),
        }
    )
    # Extract the access token from the link (it's embedded as a query param).
    # Supabase returns the full URL; we parse the token from it.
    parsed = urllib.parse.urlparse(link_response.properties.action_link)
    params = dict(urllib.parse.parse_qsl(parsed.query))
    token = params.get("token", "")

    # Exchange the OTP token for a full session.
    email = _get_user_email(admin, user_id)
    session_response = admin.auth.verify_otp({"email": email, "token": token, "type": "magiclink"})

    return {
        "access_token": session_response.session.access_token,
        "refresh_token": session_response.session.refresh_token,
        "expires_in": session_response.session.expires_in,
        "user": {
            "id": str(session_response.user.id),
            "email": session_response.user.email,
        },
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_admin_client() -> Any:
    """Return a Supabase client initialised with the service role key."""
    from supabase import create_client

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _get_user_email(admin_client: Any, user_id: str) -> str:
    """Fetch the email for a user by UUID via the admin API."""
    user = admin_client.auth.admin.get_user_by_id(user_id)
    if not user or not user.user:
        raise ValueError(f"User {user_id} not found")
    return str(user.user.email)


def _decode_credential_id(value: Any) -> bytes:
    """Decode a credential ID from whatever format Supabase returns it in.

    Supabase stores bytea columns and may return them as hex strings (\\x...)
    or base64url depending on the client version and column type.
    """
    if isinstance(value, bytes):
        return value
    if isinstance(value, str):
        if value.startswith("\\x"):
            return bytes.fromhex(value[2:])
        # Try base64url
        try:
            return base64.urlsafe_b64decode(value + "==")
        except Exception:
            return value.encode()
    if isinstance(value, list):
        return bytes(value)
    raise TypeError(f"Cannot decode credential ID from {type(value)}")


def store_passkey(passkey_data: dict[str, Any]) -> dict[str, Any]:
    """Insert a verified passkey credential into Supabase.

    Args:
        passkey_data: Dict returned by ``verify_registration``.

    Returns:
        The inserted row.
    """
    supabase = get_supabase()
    row = {
        "user_id": passkey_data["user_id"],
        # Store as hex string for Supabase bytea compatibility
        "credential_id": bytes_to_base64url(passkey_data["credential_id"]),
        "public_key": bytes_to_base64url(passkey_data["public_key"]),
        "sign_count": passkey_data["sign_count"],
        "transports": passkey_data.get("transports", []),
        "device_name": passkey_data.get("device_name"),
    }
    response = supabase.table("passkeys").insert(row).execute()
    return cast("list[dict[str, Any]]", response.data)[0]
