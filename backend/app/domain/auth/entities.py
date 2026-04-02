"""Auth domain entities."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Profile:
    """User profile entity."""

    id: UUID
    display_name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    timezone: str = "UTC"
    theme_preference: str = "system"
    privacy_mode: bool = False
    notifications_enabled: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass
class Passkey:
    """WebAuthn passkey entity."""

    id: UUID
    user_id: UUID
    credential_id: str
    public_key: str
    sign_count: int = 0
    device_name: str | None = None
    transports: list[str] = field(default_factory=list)
    last_used_at: datetime | None = None
    created_at: datetime | None = None


@dataclass
class PasskeyCreate:
    """Input DTO for creating a passkey."""

    user_id: UUID
    credential_id: str
    public_key: str
    device_name: str | None = None
    transports: list[str] | None = None
