from typing import Any, TypeVar

from pydantic import BaseModel

from app.domain.agents.interfaces.llm import ILLMClient
from app.infrastructure.external.openrouter import structured_completion

T = TypeVar("T", bound=BaseModel)


class OpenRouterLLMClient(ILLMClient):
    async def structured_completion(
        self, messages: list[dict[str, Any]], response_model: type[T]
    ) -> T:
        return await structured_completion(messages=messages, response_model=response_model)
