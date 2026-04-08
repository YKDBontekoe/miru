"""Chat domain Pydantic schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentMessageSegment(BaseModel):
    """A single agent's response within a transcript."""

    agent_name: str = Field(description="The name of the agent responding.")
    message: str = Field(description="The content of the agent's response.")


class AgentTranscript(BaseModel):
    """A collection of agent responses for multi-agent execution."""

    responses: list[AgentMessageSegment] = Field(
        description="The ordered list of agent responses to the user message."
    )


class SingleAgentResponse(BaseModel):
    """A direct response from a single agent."""

    message: str = Field(description="The content of the agent's response.")
