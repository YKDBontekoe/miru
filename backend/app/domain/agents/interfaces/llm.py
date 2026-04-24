from typing import Any, Protocol, TypeVar

T = TypeVar("T")

class ILLMClient(Protocol):
    async def structured_completion(
        self, messages: list[dict[str, Any]], response_model: type[T]
    ) -> T: ...
