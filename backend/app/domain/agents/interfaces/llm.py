from __future__ import annotations

from typing import TYPE_CHECKING, Protocol, TypeVar

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam

T = TypeVar("T")


class ILLMClient(Protocol):
    """Interface for Large Language Model clients.

    Implementations of this protocol provide a way to generate structured
    responses using an underlying LLM service (e.g., OpenRouter, OpenAI).
    """

    async def structured_completion(
        self, messages: list[ChatCompletionMessageParam], response_model: type[T]
    ) -> T:
        """Generate a structured response from the LLM.

        Args:
            messages: A list of chat messages where each represents a role and content.
            response_model: A Pydantic model or dataclass type used to parse and validate
                the LLM's output.

        Returns:
            An instance of `response_model` populated with the LLM's response.

        Raises:
            ValueError: If the LLM's output cannot be parsed into the `response_model`.
            Exception: Implementations should bubble up or wrap underlying transport or API
                errors (e.g., ConnectionError, TimeoutError).
        """
        ...
