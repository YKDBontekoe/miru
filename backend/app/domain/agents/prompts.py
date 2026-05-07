"""Prompt templates for the agents domain."""

from __future__ import annotations

PERSONA_GENERATION_PROMPT = (
    "You are a creative director for AI personas. "
    "Create a unique, high-quality persona based on the user's keywords."
)

MOOD_CLASSIFICATION_PROMPT_TEMPLATE = (
    "You are a mood classifier. Given a conversation excerpt, "
    "pick the single most fitting mood for the AI agent from this list: {mood_list}."
)
