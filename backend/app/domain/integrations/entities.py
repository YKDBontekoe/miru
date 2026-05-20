"""Integrations domain entities."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SteamUser:
    """Domain entity representing a resolved Steam user."""

    steam_id: str
    persona_name: str
