"""Memory domain models."""

from __future__ import annotations

from pydantic import BaseModel


class MemoryRequest(BaseModel):
    message: str
