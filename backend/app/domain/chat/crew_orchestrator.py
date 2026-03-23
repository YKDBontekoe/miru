"""CrewAI orchestration for the chat domain."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

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
from app.infrastructure.external.steam_tool import SteamOwnedGamesTool, SteamPlayerSummaryTool

if TYPE_CHECKING:
    from uuid import UUID

    from app.domain.agents.models import Agent

logger = logging.getLogger(__name__)

MULTI_AGENT_PROMPT = (
    "User said: {user_message}. You are managing a group chat. You MUST delegate tasks to EACH "
    "available agent so they can all contribute to the conversation. Ensure they respond to the "
    "user and to each other's points. Gather their responses and return a combined final transcript "
    "of what each agent said.{locale_instruction}"
)

SINGLE_AGENT_PROMPT = (
    "User said: {user_message}. "
    "Orchestrate a helpful conversation among available agents to assist the user."
    "{locale_instruction}"
)

MULTI_AGENT_EXPECTED_OUTPUT = "A chat transcript where multiple agents speak, formatted as 'AgentName: ...\n\nOtherAgent: ...'"


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
                backstory=a.description or "",
                llm=llm,
                allow_delegation=allow_delegation,
                tools=CrewOrchestrator.get_agent_tools(
                    a, user_id, origin_message_id=origin_message_id
                ),
            )
            for a in db_agents
        ]

    @staticmethod
    async def execute_crew_task(
        room_agents: list[Agent],
        user_message: str,
        user_id: UUID,
        user_msg_id: UUID | None = None,
        step_callback: Any | None = None,
        accept_language: str | None = None,
        allow_delegation: bool = False,
    ) -> str:
        """Build and execute the CrewAI task."""
        if not room_agents:
            logger.error("Cannot execute CrewAI task: room_agents list is empty.")
            raise ValueError("No agents available to execute the task.")

        llm = CrewOrchestrator.get_crew_llm()
        crew_agents = CrewOrchestrator.create_crew_agents(
            room_agents,
            llm,
            user_id,
            allow_delegation=allow_delegation,
            origin_message_id=user_msg_id,
        )

        locale_instruction = (
            f" Ensure you respond in the following language locale: {accept_language}."
            if accept_language
            else ""
        )

        kwargs = {}
        if step_callback:
            kwargs["step_callback"] = step_callback
            kwargs["verbose"] = True

        if len(crew_agents) > 1:
            task = Task(
                description=MULTI_AGENT_PROMPT.format(
                    user_message=user_message, locale_instruction=locale_instruction
                ),
                expected_output=MULTI_AGENT_EXPECTED_OUTPUT,
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.hierarchical,
                manager_llm=llm,
                **kwargs,
            )
        else:
            task = Task(
                description=SINGLE_AGENT_PROMPT.format(
                    user_message=user_message, locale_instruction=locale_instruction
                ),
                expected_output="A collaborative response from the most relevant agents.",
                agent=crew_agents[0],
            )
            crew = Crew(
                agents=crew_agents,  # type: ignore[arg-type]
                tasks=[task],
                process=Process.sequential,
                **kwargs,
            )

        result = await crew.kickoff_async()
        return str(result)
