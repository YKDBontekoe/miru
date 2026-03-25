"""CrewAI orchestration for the chat domain."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any, cast

import crewai
from crewai import LLM, Agent as BaseAgent, Crew, Process, Task

from app.core.config import get_settings
from app.domain.agent_tools.productivity_tools import (
    CreateEventTool,
    CreateNoteTool,
    CreateTaskTool,
    DeleteEventTool,
    ListEventsTool,
    ListNotesTool,
    ListTasksTool,
    UpdateEventTool,
    UpdateTaskTool,
)
from app.infrastructure.external.steam_tool import SteamOwnedGamesTool, SteamPlayerSummaryTool

if TYPE_CHECKING:
    from uuid import UUID

    from app.domain.agents.models import Agent

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Language mapping
# ---------------------------------------------------------------------------

_LANG_MAP: dict[str, str] = {
    "af": "Afrikaans",
    "sq": "Albanian",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bs": "Bosnian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "zh": "Chinese",
    "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "et": "Estonian",
    "fi": "Finnish",
    "fr": "French",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "he": "Hebrew",
    "hi": "Hindi",
    "hu": "Hungarian",
    "is": "Icelandic",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "ko": "Korean",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "mk": "Macedonian",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mr": "Marathi",
    "ne": "Nepali",
    "nb": "Norwegian",
    "pl": "Polish",
    "pt": "Portuguese",
    "pt-br": "Portuguese (Brazil)",
    "pt-pt": "Portuguese (Portugal)",
    "ro": "Romanian",
    "ru": "Russian",
    "sr": "Serbian",
    "sk": "Slovak",
    "sl": "Slovenian",
    "es": "Spanish",
    "sw": "Swahili",
    "sv": "Swedish",
    "tl": "Filipino",
    "ta": "Tamil",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
}


def _resolve_language(code: str) -> str:
    """Map a BCP-47 locale code to a human-readable language name.

    Falls back to the base language (stripping the region tag), then to the
    raw code if no mapping exists.
    """
    key = code.lower()
    return _LANG_MAP.get(key) or _LANG_MAP.get(key.split("-")[0]) or code


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

_HISTORY_PREFIX = (
    "Recent conversation history (for context only — do not repeat it):\n{history}\n\n"
)

_MEMORY_PREFIX = (
    "Relevant memories from past conversations (background context — do not repeat verbatim):\n"
    "{memories}\n\n"
)

MULTI_AGENT_PROMPT = (
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


class _OpenRouterLLM(LLM):
    """CrewAI LLM wrapper that supports function calling via OpenRouter.

    CrewAI's built-in OpenAI provider hardcodes ``tool_choice: auto`` whenever
    tools are present, which causes a 404 on many OpenRouter routes that do not
    implement that parameter. This wrapper advertises function-calling support
    by returning ``True`` from ``supports_function_calling`` and drops the
    incompatible ``tool_choice`` parameter via ``additional_drop_params``.
    """

    def supports_function_calling(self) -> bool:
        return True


class CrewOrchestrator:
    """Handles the creation and execution of CrewAI tasks and agents."""

    @staticmethod
    def get_crew_llm() -> _OpenRouterLLM:
        """Build a CrewAI LLM instance backed by OpenRouter."""
        settings = get_settings()
        return _OpenRouterLLM(
            model=f"openrouter/{settings.default_chat_model}",
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            additional_drop_params=["tool_choice"],
        )

    @staticmethod
    def get_agent_tools(agent: Agent, user_id: UUID, origin_message_id: UUID | None = None) -> list:
        """Build the tool list for an agent from its prefetched integrations."""
        tools = []
        for ai in getattr(agent, "agent_integrations", []):
            if not ai.enabled:
                continue
            if ai.integration_id == "steam":
                steam_id = ai.config.get("steam_id")
                if steam_id:
                    tools.extend(
                        [
                            SteamPlayerSummaryTool(steam_id=steam_id),
                            SteamOwnedGamesTool(steam_id=steam_id),
                        ]
                    )

        tools.extend(
            [
                ListTasksTool(user_id=user_id, agent_id=agent.id),
                ListEventsTool(user_id=user_id, agent_id=agent.id),
                CreateEventTool(
                    user_id=user_id, agent_id=agent.id, origin_message_id=origin_message_id
                ),
                UpdateEventTool(user_id=user_id, agent_id=agent.id),
                DeleteEventTool(user_id=user_id, agent_id=agent.id),
                CreateTaskTool(user_id=user_id, agent_id=agent.id),
                UpdateTaskTool(user_id=user_id, agent_id=agent.id),
                ListNotesTool(user_id=user_id, agent_id=agent.id),
                CreateNoteTool(
                    user_id=user_id, agent_id=agent.id, origin_message_id=origin_message_id
                ),
            ]
        )
        return tools

    @staticmethod
    def create_crew_agents(
        db_agents: list[Agent],
        llm: LLM,
        user_id: UUID,
        allow_delegation: bool = False,
        origin_message_id: UUID | None = None,
    ) -> list[crewai.Agent]:
        """Helper to create crewai.Agent instances from DB agents."""
        return [
            crewai.Agent(
                role=a.name,
                goal=a.personality,
                backstory=(
                    a.system_prompt
                    or a.description
                    or (
                        "Respond naturally and concisely. "
                        "Only contribute when the message is relevant to your specialty."
                    )
                ),
                llm=llm,
                allow_delegation=allow_delegation,
                tools=CrewOrchestrator.get_agent_tools(
                    a, user_id, origin_message_id=origin_message_id
                ),
            )
            for a in db_agents
        ]

    @staticmethod
    def format_history(history: list[dict] | None) -> str:
        """Format conversation history into a compact context string."""
        if not history:
            return ""
        lines = []
        for entry in history[-10:]:  # cap at last 10 turns to keep prompt size reasonable
            role = entry.get("role", "")
            content = entry.get("content", "").strip()
            if not content:
                continue
            prefix = "User" if role == "user" else entry.get("name", "Agent")
            lines.append(f"{prefix}: {content}")
        return "\n".join(lines)

    @staticmethod
    async def execute_crew_task(
        room_agents: list[Agent],
        user_message: str,
        user_id: UUID,
        user_msg_id: UUID | None = None,
        step_callback: Any | None = None,
        accept_language: str | None = None,
        conversation_history: list[dict] | None = None,
        memory_context: str | None = None,
    ) -> str:
        """Build and execute the CrewAI task.

        ``conversation_history`` is a list of ``{"role": "user"|"agent", "name": str,
        "content": str}`` dicts representing recent messages, used to give agents
        context without them having to ask for it.

        ``memory_context`` is a pre-formatted string of relevant memories retrieved
        via vector similarity search, injected before the history section.
        """
        if not room_agents:
            logger.error("Cannot execute CrewAI task: room_agents list is empty.")
            raise ValueError("No agents available to execute the task.")

        is_multi = len(room_agents) > 1
        llm = CrewOrchestrator.get_crew_llm()
        crew_agents = CrewOrchestrator.create_crew_agents(
            room_agents,
            llm,
            user_id,
            # In multi-agent rooms agents are allowed to address each other.
            allow_delegation=is_multi,
            origin_message_id=user_msg_id,
        )

        locale_instruction = (
            f" Ensure you respond in {_resolve_language(accept_language)}."
            if accept_language
            else ""
        )

        history_text = CrewOrchestrator.format_history(conversation_history)
        history_section = _HISTORY_PREFIX.format(history=history_text) if history_text else ""
        memory_section = _MEMORY_PREFIX.format(memories=memory_context) if memory_context else ""

        kwargs = {}
        if step_callback:
            kwargs["step_callback"] = step_callback
            kwargs["verbose"] = True

        if is_multi:
            task = Task(
                description=MULTI_AGENT_PROMPT.format(
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),
                expected_output=MULTI_AGENT_EXPECTED_OUTPUT,
            )
            crew = Crew(
                agents=crew_agents,  # ty: ignore[invalid-argument-type]
                tasks=[task],
                process=Process.hierarchical,
                manager_llm=llm,
                **kwargs,
            )
        else:
            task = Task(
                description=SINGLE_AGENT_PROMPT.format(
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),
                expected_output=SINGLE_AGENT_EXPECTED_OUTPUT,
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=crew_agents,  # ty: ignore[invalid-argument-type]
                tasks=[task],
                process=Process.sequential,
                **kwargs,
            )

        # Retry once on transient failures (e.g. output-parsing errors from the LLM).
        result = None
        for attempt in (0, 1):
            try:
                result = await crew.kickoff_async()
                break
            except asyncio.CancelledError:
                raise
            except Exception:
                if attempt == 1:
                    raise
                logger.warning("Crew kickoff failed on attempt 1, retrying in 2 s…")
                await asyncio.sleep(2)

        return str(result)
