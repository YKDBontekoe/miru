import re

with open("app/domain/chat/crew_orchestrator.py", "r") as f:
    content = f.read()

# Add room_summary to execute_crew_task signature
content = content.replace(
    """    async def execute_crew_task(
        room_agents: list[Agent],
        user_message: str,
        user_id: UUID,
        user_msg_id: UUID | None = None,
        step_callback: Any | None = None,
        accept_language: str | None = None,
        conversation_history: list[dict] | None = None,
        memory_context: str | None = None,
    ) -> str:""",
    """    async def execute_crew_task(
        room_agents: list[Agent],
        user_message: str,
        user_id: UUID,
        user_msg_id: UUID | None = None,
        step_callback: Any | None = None,
        accept_language: str | None = None,
        conversation_history: list[dict] | None = None,
        memory_context: str | None = None,
        room_summary: str | None = None,
    ) -> str:""",
)

# Add _SUMMARY_PREFIX
content = content.replace(
    """_MEMORY_PREFIX = (
    "--- RELEVANT MEMORIES ---\\n"
    "{memories}\\n\\n"
)""",
    """_MEMORY_PREFIX = (
    "--- RELEVANT MEMORIES ---\\n"
    "{memories}\\n\\n"
)

_SUMMARY_PREFIX = (
    "--- PREVIOUS CONVERSATION SUMMARY ---\\n"
    "{summary}\\n\\n"
)""",
)

# Update Prompts
content = content.replace(
    '''MULTI_AGENT_PROMPT = (
    "{memory_section}"
    "{history_section}"
    "User said: {user_message}. "''',
    '''MULTI_AGENT_PROMPT = (
    "{summary_section}"
    "{memory_section}"
    "{history_section}"
    "User said: {user_message}. "''',
)

content = content.replace(
    '''SINGLE_AGENT_PROMPT = (
    "{memory_section}"
    "{history_section}"
    "User said: {user_message}. "''',
    '''SINGLE_AGENT_PROMPT = (
    "{summary_section}"
    "{memory_section}"
    "{history_section}"
    "User said: {user_message}. "''',
)

# Update variable passing
content = content.replace(
    '''        history_text = CrewOrchestrator.format_history(conversation_history)
        history_section = _HISTORY_PREFIX.format(history=history_text) if history_text else ""
        memory_section = _MEMORY_PREFIX.format(memories=memory_context) if memory_context else ""''',
    '''        history_text = CrewOrchestrator.format_history(conversation_history)
        history_section = _HISTORY_PREFIX.format(history=history_text) if history_text else ""
        memory_section = _MEMORY_PREFIX.format(memories=memory_context) if memory_context else ""
        summary_section = _SUMMARY_PREFIX.format(summary=room_summary) if room_summary else ""''',
)

content = content.replace(
    """                description=MULTI_AGENT_PROMPT.format(
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),""",
    """                description=MULTI_AGENT_PROMPT.format(
                    summary_section=summary_section,
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),""",
)

content = content.replace(
    """                description=SINGLE_AGENT_PROMPT.format(
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),""",
    """                description=SINGLE_AGENT_PROMPT.format(
                    summary_section=summary_section,
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),""",
)

with open("app/domain/chat/crew_orchestrator.py", "w") as f:
    f.write(content)
