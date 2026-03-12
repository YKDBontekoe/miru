"""Auth domain models."""

from __future__ import annotations

from datetime import datetime  # noqa: TCH003
from uuid import UUID  # noqa: TCH003

from pydantic import BaseModel, ConfigDict, Field


class JWTPayload(BaseModel):
    """Structure of a Supabase-issued JWT."""

    sub: UUID
    email: str | None = None
    role: str | None = None
    exp: int
    iat: int
    aud: str | list[str] | None = None

    model_config = ConfigDict(extra="allow")


class PasskeyRecord(BaseModel):
    """Structure of a passkey database record."""

    id: UUID
    user_id: UUID
    credential_id: str
    public_key: str
    sign_count: int
    device_name: str | None = None
    transports: list[str] = Field(default_factory=list)
    last_used_at: datetime | None = None
    created_at: datetime


class PasskeyRegisterOptionsRequest(BaseModel):
    device_name: str | None = None


class PasskeyRegisterVerifyRequest(BaseModel):
    challenge_id: str
    credential: str  # JSON-encoded PublicKeyCredential
    device_name: str | None = None


class PasskeyLoginOptionsRequest(BaseModel):
    email: str


class PasskeyLoginVerifyRequest(BaseModel):
    challenge_id: str
    credential: str  # JSON-encoded PublicKeyCredential (assertion)
