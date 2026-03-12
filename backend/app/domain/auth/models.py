"""Auth domain models."""

from __future__ import annotations

from pydantic import BaseModel


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
