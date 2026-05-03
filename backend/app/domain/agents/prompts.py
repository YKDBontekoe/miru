"""Prompt templates for the agents domain."""

from __future__ import annotations

# Agent Profile Generation
AGENT_GENERATION_SYSTEM_PROMPT = (
    "You are a creative director for AI personas. "
    "Create a unique, high-quality persona based on the user's keywords."
)

AGENT_GENERATION_USER_PROMPT = "Keywords: {keywords}"

# Mood Classification
MOOD_CLASSIFIER_SYSTEM_PROMPT = (
    "You are a mood classifier. Given a conversation excerpt, "
    "pick the single most fitting mood for the AI agent from this list: {mood_list}."
)

MOOD_CLASSIFIER_USER_PROMPT = "--- CONVERSATION EXCERPT ---\n{recent_history}\n----------------------------"

# Agent System Prompt Builder
SYSTEM_PROMPT_IDENTITY = (
    "You are {name}.\n"
    "Respond naturally and concisely like a real person in a chat. "
    "Never introduce yourself, announce your capabilities, or explain what you can do "
    "unless the user specifically asks. Just answer helpfully and directly."
)

SYSTEM_PROMPT_PERSONALITY = "\nPersonality & Behavior:\n{personality}"

SYSTEM_PROMPT_GOALS = "\nYour Goals:\n{goals}"

SYSTEM_PROMPT_CAPABILITIES = (
    "\nYou have access to the following tools: {cap_list}. "
    "Use them proactively when the user's request calls for it, "
    "but do not mention or advertise them."
)
