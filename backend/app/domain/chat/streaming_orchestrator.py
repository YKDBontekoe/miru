"""Chat streaming orchestrator."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import openai

from app.core.config import get_settings
from app.infrastructure.external.openrouter import stream_chat

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from uuid import UUID

    from openai.types.chat import ChatCompletionMessageParam

    from app.infrastructure.repositories.agent_repo import AgentRepository

logger = logging.getLogger(__name__)


class StreamingOrchestrator:
    """Orchestrates direct streaming interactions for non-room chat."""

    @staticmethod
    async def stream_responses(
        agent_repo: AgentRepository,
        user_message: str,
        user_id: UUID,
        accept_language: str | None = None,
    ) -> AsyncIterator[str]:
        """A simple non-room chat stream for general queries using the first available agent."""
        db_agents = await agent_repo.list_by_user(user_id)
        if not db_agents:
            yield "No agents available. Please create one first."
            return

        agent = db_agents[0]
        model_name = get_settings().default_chat_model

        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": agent.personality}
        ]
        if accept_language:
            messages.append(
                {
                    "role": "system",
                    "content": f"IMPORTANT: Please respond in the following language locale: {accept_language}",
                }
            )
        messages.append({"role": "user", "content": user_message})

        try:
            response = await stream_chat(
                model=model_name,
                messages=messages,
            )

            async for chunk in response:
                if not chunk.choices:
                    continue
                delta_content = chunk.choices[0].delta.content
                if delta_content:
                    yield delta_content
            yield "[[STATUS:done]]\n"
        except TimeoutError:
            logger.warning("Timeout connecting to AI service for user=%s", user_id)
            yield "\n[[STATUS:error]]\nConnection timed out. Please try again later.\n"
        except Exception as e:
            if isinstance(e, (openai.APIConnectionError, openai.APITimeoutError, OSError)):
                logger.warning("Connection error to AI service for user=%s", user_id)
                yield "\n[[STATUS:error]]\nConnection error. Please try again later.\n"
            else:
                logger.exception("Unexpected error in chat stream for user=%s", user_id)
                yield "\n[[STATUS:error]]\nAn unexpected error occurred.\n"
