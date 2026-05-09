"""Prompt templates for the chat domain."""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

HISTORY_PREFIX = (
    "Recent conversation history (for context only — do not repeat it):\n"
    "--- CONVERSATION HISTORY ---\n{history}\n--- END CONVERSATION HISTORY ---\n\n"
)

MEMORY_PREFIX = (
    "Relevant memories from past conversations (background context — do not repeat verbatim):\n"
    "--- MEMORIES ---\n{memories}\n--- END MEMORIES ---\n\n"
)

SUMMARY_PREFIX = (
    "Summary of the older parts of this conversation:\n"
    "--- SUMMARY ---\n{summary}\n--- END SUMMARY ---\n\n"
)

MULTI_AGENT_PROMPT = (
    "{summary_section}"
    "{memory_section}"
    "{history_section}"
    "You are managing a group chat with specialized agents. "
    "Delegate ONLY to agents whose expertise is directly relevant to the user's request — "
    "do NOT force every agent to respond. "
    "Agents should reply naturally and concisely, like a real person in a chat, "
    "without introducing themselves or listing their capabilities. "
    "Agents MAY respond to each other's points if it adds value. "
    "If an agent has nothing useful to add, they should stay silent. "
    "When the user asks for planning or organization, proactively use productivity tools "
    "(tasks/notes/events) and propose a concrete plan. "
    "Before creating, updating, or deleting tasks/notes/events, confirm intent briefly unless "
    "the user explicitly asked you to perform the action now. "
    "Return a transcript of only the agents who actually responded, "
    "formatted as 'AgentName: message' with one blank line between agents.{locale_instruction}\n\n"
    "--- LATEST USER MESSAGE ---\n{user_message}\n--- END LATEST USER MESSAGE ---"
)

SINGLE_AGENT_PROMPT = (
    "{summary_section}"
    "{memory_section}"
    "{history_section}"
    "Respond naturally and helpfully as yourself. "
    "When relevant, be proactive about planning and converting intent into tasks/notes/events. "
    "Confirm before write actions unless the user explicitly requested immediate execution. "
    "Do not introduce yourself or list your capabilities — just answer directly.{locale_instruction}\n\n"
    "--- LATEST USER MESSAGE ---\n{user_message}\n--- END LATEST USER MESSAGE ---"
)

MULTI_AGENT_EXPECTED_OUTPUT = (
    "A chat transcript with only the relevant agents responding. "
    "Format: 'AgentName: message' with one blank line between agents. "
    "Agents should be concise and natural, not self-promotional."
)

SINGLE_AGENT_EXPECTED_OUTPUT = "A direct, helpful response to the user's message."

AGENT_PROFILE_SYSTEM_PROMPT = (
    "You are a creative director for AI personas. "
    "Create a unique, high-quality persona based on the user's keywords."
)

AGENT_PROFILE_USER_PROMPT = "--- KEYWORDS ---\n{keywords}\n--- END KEYWORDS ---"

MOOD_CLASSIFIER_SYSTEM_PROMPT = (
    "You are a mood classifier. Given a conversation excerpt, "
    "pick the single most fitting mood for the AI agent from this list: "
    "{mood_list}."
)

MOOD_CLASSIFIER_USER_PROMPT = "--- CONVERSATION EXCERPT ---\n{recent_history}\n--- END CONVERSATION EXCERPT ---"

ROOM_SUMMARY_SYSTEM_PROMPT = (
    "You are an AI tasked with maintaining a concise running summary of a chat room conversation. "
    "Please generate a new, comprehensive but concise summary of the ENTIRE conversation (merging the current summary with the new messages). "
    "Focus on the main topics discussed, user preferences revealed, and any ongoing tasks or context the agents need to remember."
)

ROOM_SUMMARY_USER_PROMPT = (
    "--- CURRENT SUMMARY ---\n{current_summary}\n--- END CURRENT SUMMARY ---\n\n"
    "--- LATEST MESSAGES ---\n{transcript}\n--- END LATEST MESSAGES ---"
)

GRAPH_EXTRACTION_SYSTEM_PROMPT = (
    "You are a knowledge graph extraction system. Extract key entities and relationships from the user's text. "
    "Be concise and precise. Focus on long-term facts, preferences, and relationships."
)

GRAPH_EXTRACTION_USER_PROMPT = "--- TEXT TO EXTRACT ---\n{text}\n--- END TEXT TO EXTRACT ---"

STREAM_CHAT_USER_PROMPT = "--- LATEST USER MESSAGE ---\n{user_message}\n--- END LATEST USER MESSAGE ---"

BUILD_SYSTEM_PROMPT_TEMPLATE = (
    "You are {name}.\n"
    "Respond naturally and concisely like a real person in a chat. "
    "Never introduce yourself, announce your capabilities, or explain what you can do "
    "unless the user specifically asks. Just answer helpfully and directly.\n"
    "{description}"
    "\nPersonality & Behavior:\n{personality}\n"
    "{goals_section}"
    "{tools_section}"
)
