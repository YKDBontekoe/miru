from __future__ import annotations

from typing import TYPE_CHECKING, TypeVar

from app.domain.agents.interfaces.llm import ILLMClient
from app.infrastructure.external.openrouter import (
    structured_completion as openrouter_structured_completion,
)

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam

T = TypeVar("T")


class OpenRouterLLMClient(ILLMClient):
    """Implementation of ILLMClient using OpenRouter via OpenAI's python package.

    This client delegates structured completion requests to the `openrouter`
    infrastructure module, which integrates with `instructor` to parse LLM
    outputs directly into Pydantic models.
    """

    async def structured_completion(
        self, messages: list[ChatCompletionMessageParam], response_model: type[T]
    ) -> T:
        """Generate a structured response from OpenRouter.

        Args:
            messages: A list of chat completion messages.
            response_model: The Pydantic model type to parse the response into.

        Returns:
            An instance of `response_model` with the parsed data.

        Raises:
            Exception: Any transport or API errors from the OpenRouter client.
        """
        return await openrouter_structured_completion(
            messages=messages, response_model=response_model
        )
