"""Schemas for the integrations domain."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SteamUserResponse(BaseModel):
    """Schema for a resolved Steam user response."""

    steam_id: str = Field(..., description="The 64-bit Steam ID")
    persona_name: str = Field(..., description="The user's persona name on Steam")
