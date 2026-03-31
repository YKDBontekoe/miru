"""CrewAI orchestration for the chat domain."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any, cast

import crewai
from crewai import LLM, Crew, Process, Task

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
from app.domain.chat.language import resolve_language
from app.domain.chat.prompts import (
    HISTORY_PREFIX,
    MEMORY_PREFIX,
    MULTI_AGENT_EXPECTED_OUTPUT,
    MULTI_AGENT_PROMPT,
    SINGLE_AGENT_EXPECTED_OUTPUT,
    SINGLE_AGENT_PROMPT,
    SUMMARY_PREFIX,
)
from app.infrastructure.external.discord_tool import (
    DiscordGetServerInfoTool,
    DiscordSendMessageTool,
)
from app.infrastructure.external.spotify_tool import (
    SpotifyCurrentlyPlayingTool,
    SpotifyRecentlyPlayedTool,
    SpotifySearchTool,
)
from app.infrastructure.external.steam_tool import SteamOwnedGamesTool, SteamPlayerSummaryTool

if TYPE_CHECKING:
    from uuid import UUID

    from app.domain.agents.models import Agent

logger = logging.getLogger(__name__)


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
            elif ai.integration_id == "spotify":
                access_token = ai.config.get("access_token")
                if access_token:
                    tools.extend(
                        [
                            SpotifyCurrentlyPlayingTool(access_token=access_token),
                            SpotifyRecentlyPlayedTool(access_token=access_token),
                        ]
                    )
                    tools.append(SpotifySearchTool(access_token=access_token))
            elif ai.integration_id == "discord":
                bot_token = ai.config.get("bot_token")
                if bot_token:
                    guild_id = ai.config.get("guild_id")
                    if guild_id:
                        tools.append(
                            DiscordGetServerInfoTool(bot_token=bot_token, guild_id=guild_id)
                        )

                    channel_id = ai.config.get("channel_id")
                    content_val = ai.config.get("content")
                    if channel_id and content_val:
                        tools.append(
                            DiscordSendMessageTool(
                                bot_token=bot_token, channel_id=channel_id, content=content_val
                            )
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
        room_summary: str | None = None,
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
            f" Ensure you respond in {resolve_language(accept_language)}."
            if accept_language
            else ""
        )

        history_text = CrewOrchestrator.format_history(conversation_history)
        history_section = HISTORY_PREFIX.format(history=history_text) if history_text else ""
        memory_section = MEMORY_PREFIX.format(memories=memory_context) if memory_context else ""
        summary_section = SUMMARY_PREFIX.format(summary=room_summary) if room_summary else ""

        kwargs = {}
        if step_callback:
            kwargs["step_callback"] = step_callback
            kwargs["verbose"] = True

        if is_multi:
            task = Task(
                description=MULTI_AGENT_PROMPT.format(
                    summary_section=summary_section,
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),
                expected_output=MULTI_AGENT_EXPECTED_OUTPUT,
            )
            crew = Crew(
                agents=cast("Any", crew_agents),
                tasks=[task],
                process=Process.hierarchical,
                manager_llm=llm,
                **kwargs,
            )
        else:
            task = Task(
                description=SINGLE_AGENT_PROMPT.format(
                    summary_section=summary_section,
                    memory_section=memory_section,
                    history_section=history_section,
                    user_message=user_message,
                    locale_instruction=locale_instruction,
                ),
                expected_output=SINGLE_AGENT_EXPECTED_OUTPUT,
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=cast("Any", crew_agents),
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
