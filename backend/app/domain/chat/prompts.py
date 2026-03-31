"""Prompt templates for the chat domain."""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

HISTORY_PREFIX = "Recent conversation history (for context only — do not repeat it):\n{history}\n\n"

MEMORY_PREFIX = (
    "Relevant memories from past conversations (background context — do not repeat verbatim):\n"
    "{memories}\n\n"
)

SUMMARY_PREFIX = "Summary of the older parts of this conversation:\n{summary}\n\n"

MULTI_AGENT_PROMPT = (
    "{summary_section}"
    "{memory_section}"
    "{history_section}"
    "User said: {user_message}. "
    "You are managing a group chat with specialized agents. "
    "Delegate ONLY to agents whose expertise is directly relevant to the user's request — "
    "do NOT force every agent to respond. "
    "Agents should reply naturally and concisely, like a real person in a chat, "
    "without introducing themselves or listing their capabilities. "
    "Agents MAY respond to each other's points if it adds value. "
    "If an agent has nothing useful to add, they should stay silent. "
    "Return a transcript of only the agents who actually responded, "
    "formatted as 'AgentName: message' with one blank line between agents.{locale_instruction}"
)

SINGLE_AGENT_PROMPT = (
    "{summary_section}"
    "{memory_section}"
    "{history_section}"
    "User said: {user_message}. "
    "Respond naturally and helpfully as yourself. "
    "Do not introduce yourself or list your capabilities — just answer directly.{locale_instruction}"
)

MULTI_AGENT_EXPECTED_OUTPUT = (
    "A chat transcript with only the relevant agents responding. "
    "Format: 'AgentName: message' with one blank line between agents. "
    "Agents should be concise and natural, not self-promotional."
)

SINGLE_AGENT_EXPECTED_OUTPUT = "A direct, helpful response to the user's message."
