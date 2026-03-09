"""CrewAI integration for Miru.

This module dynamically builds a :class:`crewai.Crew` whose composition is
determined by the *task type* inferred from the user's message.  Each task
type maps to a specialised set of agents and tasks so that complex requests
are handled collaboratively rather than by a single monolithic prompt.

Supported task types
--------------------
``research``
    A **Researcher** agent gathers and analyses information, then a
    **Synthesiser** agent distills the findings into a clear answer.

``planning``
    A **Planner** agent breaks the goal into actionable steps, then a
    **Reviewer** agent critiques and refines the plan.

``summarisation``
    A **Summariser** agent condenses the input, then an **Editor** agent
    polishes the summary for clarity and conciseness.

``general`` (default)
    A **Thinker** agent reasons through the problem, then an **Responder**
    agent formulates the final reply.

Usage
-----
::

    result = await run_crew(
        message="Summarise the key points of ...",
        memories=["User prefers bullet points"],
    )
"""

from __future__ import annotations

import asyncio
import re
from typing import Any, Literal

from crewai import LLM, Agent, Crew, Process, Task

from app.config import get_settings

# ---------------------------------------------------------------------------
# Task-type detection
# ---------------------------------------------------------------------------

TaskType = Literal["research", "planning", "summarisation", "general"]

_RESEARCH_KEYWORDS = re.compile(
    r"\b(research|find out|look up|investigate|explain|what is|who is|how does|why does)\b",
    re.IGNORECASE,
)
_PLANNING_KEYWORDS = re.compile(
    r"\b(plan|schedule|organise|organize|roadmap|steps to|how to|strategy|checklist)\b",
    re.IGNORECASE,
)
_SUMMARY_KEYWORDS = re.compile(
    r"\b(summar|summarise|summarize|condense|tldr|tl;dr|brief|overview|recap)\b",
    re.IGNORECASE,
)

_KEYWORD_TO_TASK_TYPE: tuple[tuple[re.Pattern, TaskType], ...] = (
    (_SUMMARY_KEYWORDS, "summarisation"),
    (_PLANNING_KEYWORDS, "planning"),
    (_RESEARCH_KEYWORDS, "research"),
)


def detect_task_type(message: str) -> TaskType:
    """Infer the most appropriate task type from *message* content."""
    for pattern, task_type in _KEYWORD_TO_TASK_TYPE:
        if pattern.search(message):
            return task_type
    return "general"


# ---------------------------------------------------------------------------
# LLM factory
# ---------------------------------------------------------------------------


def _make_llm() -> LLM:
    """Return a CrewAI LLM backed by OpenRouter using the configured default model."""
    model = get_settings().default_chat_model
    # CrewAI uses LiteLLM under the hood; prefix with "openrouter/" so
    # LiteLLM routes to the OpenRouter gateway automatically.
    litellm_model = f"openrouter/{model}" if not model.startswith("openrouter/") else model
    return LLM(
        model=litellm_model,
        api_key=get_settings().openrouter_api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.7,
    )


# ---------------------------------------------------------------------------
# Crew builders
# ---------------------------------------------------------------------------


def _create_sequential_crew(agents: list[Any], tasks: list[Any]) -> Crew:
    """Helper to initialize a sequential Crew object."""
    return Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=False,
    )


def _build_research_crew(message: str, context: str, llm: LLM) -> tuple[Crew, Task]:
    researcher = Agent(
        role="Research Analyst",
        goal="Gather comprehensive, accurate information to answer the user's question.",
        backstory=(
            "You are a meticulous research analyst with expertise in synthesising "
            "information from diverse sources.  You produce well-structured analyses "
            "that are factual, nuanced, and easy to follow."
        ),
        llm=llm,
        verbose=False,
    )
    synthesiser = Agent(
        role="Knowledge Synthesiser",
        goal="Distil research findings into a clear, concise, actionable answer.",
        backstory=(
            "You excel at taking dense research and transforming it into clear "
            "prose that directly addresses the user's needs."
        ),
        llm=llm,
        verbose=False,
    )

    research_task = Task(
        description=(
            f"{context}\n\n"
            f"User question: {message}\n\n"
            "Research this topic thoroughly.  Identify key facts, relevant context, "
            "and any important nuances.  Structure your findings clearly."
        ),
        expected_output="A detailed research analysis with key findings and supporting evidence.",
        agent=researcher,
    )
    synthesis_task = Task(
        description=(
            "Using the research analysis above, write a clear, direct answer to the "
            "user's question.  Be concise yet complete.  Use bullet points where helpful."
        ),
        expected_output="A clear, concise answer that directly addresses the user's question.",
        agent=synthesiser,
        context=[research_task],
    )

    crew = _create_sequential_crew([researcher, synthesiser], [research_task, synthesis_task])
    return crew, synthesis_task


def _build_planning_crew(message: str, context: str, llm: LLM) -> tuple[Crew, Task]:
    planner = Agent(
        role="Strategic Planner",
        goal="Create a structured, actionable plan that achieves the user's goal.",
        backstory=(
            "You are an expert project planner who breaks down complex objectives "
            "into clear, achievable steps with sensible priorities and sequencing."
        ),
        llm=llm,
        verbose=False,
    )
    reviewer = Agent(
        role="Plan Reviewer",
        goal="Critique and refine the plan to maximise clarity, feasibility, and completeness.",
        backstory=(
            "You have a sharp eye for gaps and ambiguities in plans.  You improve "
            "plans by adding missing steps, clarifying vague actions, and ensuring "
            "logical ordering."
        ),
        llm=llm,
        verbose=False,
    )

    plan_task = Task(
        description=(
            f"{context}\n\n"
            f"User goal: {message}\n\n"
            "Create a detailed, step-by-step plan.  Number each step and include "
            "brief explanations for non-obvious actions."
        ),
        expected_output="A numbered action plan with clear, achievable steps.",
        agent=planner,
    )
    review_task = Task(
        description=(
            "Review the plan above.  Identify any gaps, unclear steps, or missing "
            "considerations.  Produce a refined final version of the plan."
        ),
        expected_output="A polished, complete action plan ready for execution.",
        agent=reviewer,
        context=[plan_task],
    )

    crew = _create_sequential_crew([planner, reviewer], [plan_task, review_task])
    return crew, review_task


def _build_summarisation_crew(message: str, context: str, llm: LLM) -> tuple[Crew, Task]:
    summariser = Agent(
        role="Content Summariser",
        goal="Produce an accurate, concise summary that captures all key points.",
        backstory=(
            "You are skilled at reading dense material and extracting the essential "
            "information without losing important nuances."
        ),
        llm=llm,
        verbose=False,
    )
    editor = Agent(
        role="Copy Editor",
        goal="Polish the summary for clarity, flow, and conciseness.",
        backstory=(
            "You have an excellent command of language and a talent for making "
            "text clear, engaging, and appropriately brief."
        ),
        llm=llm,
        verbose=False,
    )

    summary_task = Task(
        description=(
            f"{context}\n\n"
            f"Content to summarise: {message}\n\n"
            "Write a comprehensive summary that covers all key points."
        ),
        expected_output="A complete summary covering all key points.",
        agent=summariser,
    )
    edit_task = Task(
        description=(
            "Refine the summary above.  Improve clarity and conciseness without "
            "losing any important points.  Use bullet points for lists of items."
        ),
        expected_output="A polished, concise summary ready to present to the user.",
        agent=editor,
        context=[summary_task],
    )

    crew = _create_sequential_crew([summariser, editor], [summary_task, edit_task])
    return crew, edit_task


def _build_general_crew(message: str, context: str, llm: LLM) -> tuple[Crew, Task]:
    thinker = Agent(
        role="Deep Thinker",
        goal="Reason carefully through the user's message to form an insightful perspective.",
        backstory=(
            "You are a thoughtful generalist who approaches problems methodically, "
            "considers multiple angles, and forms well-reasoned opinions."
        ),
        llm=llm,
        verbose=False,
    )
    responder = Agent(
        role="Conversational Responder",
        goal="Craft a warm, helpful, and direct response for the user.",
        backstory=(
            "You are Miru, a warm and thoughtful personal AI assistant.  You take "
            "the thinker's reasoning and turn it into a natural, human reply that "
            "directly addresses what the user needs."
        ),
        llm=llm,
        verbose=False,
    )

    think_task = Task(
        description=(
            f"{context}\n\n"
            f"User message: {message}\n\n"
            "Think carefully about what the user needs.  Consider their intent, "
            "any relevant background, and the best way to help them."
        ),
        expected_output="A structured reasoning analysis with key insights about how to best respond.",
        agent=thinker,
    )
    respond_task = Task(
        description=(
            "Using the reasoning above, write the final reply to the user.  "
            "Be warm, concise, and directly helpful.  Incorporate any relevant "
            "memories naturally."
        ),
        expected_output="A friendly, concise, and helpful reply to the user's message.",
        agent=responder,
        context=[think_task],
    )

    crew = _create_sequential_crew([thinker, responder], [think_task, respond_task])
    return crew, respond_task


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_CREW_BUILDERS = {
    "research": _build_research_crew,
    "planning": _build_planning_crew,
    "summarisation": _build_summarisation_crew,
    "general": _build_general_crew,
}


async def run_crew(
    message: str,
    memories: list[str] | None = None,
) -> str:
    """Run a dynamically composed CrewAI crew and return the final output.

    Args:
        message: The user's message.
        memories: Relevant memories retrieved from pgvector, injected into
                  the task context.

    Returns:
        The crew's final output as a plain string.
    """
    task_type = detect_task_type(message)
    llm = _make_llm()

    # Build memory context block
    if memories:
        joined = "\n- ".join(memories)
        context = f"Relevant things remembered about the user:\n- {joined}"
    else:
        context = ""

    builder = _CREW_BUILDERS[task_type]
    crew, _final_task = builder(message, context, llm)

    # CrewAI's kickoff is synchronous — run it in a thread executor to avoid
    # blocking the async event loop.
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, crew.kickoff)

    # result is a CrewOutput object; coerce to string
    return str(result)
