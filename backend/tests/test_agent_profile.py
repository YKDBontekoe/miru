"""Tests for AI-powered agent profile generation."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.domain.agents.models import AgentGenerationResponse
from app.domain.agents.service import AgentService


@pytest.mark.asyncio
async def test_generate_agent_profile_returns_valid_response() -> None:
    """generate_agent_profile must return a properly structured AgentGenerationResponse."""
    expected = AgentGenerationResponse(
        name="The Scholar",
        personality="Curious, analytical, loves to explore ideas",
        description="An AI scholar dedicated to deep research",
        goals=["Research topics", "Summarize findings", "Answer questions"],
        capabilities=["web_search", "memory"],
        suggested_integrations=[],
    )

    repo = MagicMock()
    service = AgentService(repo)

    with patch(
        "app.domain.agents.service.structured_completion",
        AsyncMock(return_value=expected),
    ):
        result = await service.generate_agent_profile("scholar research academic")

    assert result.name == "The Scholar"
    assert len(result.goals) > 0
    assert isinstance(result.capabilities, list)


@pytest.mark.asyncio
async def test_generate_agent_profile_passes_keywords_to_llm() -> None:
    """generate_agent_profile must pass user keywords to the LLM."""
    expected = AgentGenerationResponse(
        name="Test",
        personality="Test",
        description="Test",
        goals=["Goal"],
        capabilities=[],
        suggested_integrations=[],
    )

    repo = MagicMock()
    service = AgentService(repo)

    captured = {}

    async def capture(**kwargs):
        captured.update(kwargs)
        return expected

    with patch("app.domain.agents.service.structured_completion", capture):
        await service.generate_agent_profile("creative writer storyteller")

    assert any(
        "creative writer storyteller" in str(msg.get("content", ""))
        for msg in captured.get("messages", [])
    )
