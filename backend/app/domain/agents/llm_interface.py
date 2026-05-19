"""LLM Interface for the Agent Domain."""

from __future__ import annotations

from typing import TYPE_CHECKING, Protocol, TypeVar

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam

T = TypeVar("T")


class LLMInterface(Protocol):
    """Protocol for structured language model completions."""

    async def structured_completion(
        self,
        messages: list[ChatCompletionMessageParam],
        response_model: type[T],
    ) -> T:
        """Generate a structured completion from a language model."""
        ...
