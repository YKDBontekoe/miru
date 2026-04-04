from __future__ import annotations

import functools
import inspect
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


def handle_tool_error(
    reraise: tuple[type[Exception], ...] = (),
    default_message: str = "Error executing tool.",
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator to consolidate repetitive catch-all `except Exception:` blocks in CrewAI tools.

    It catches `Exception` during tool execution. If the exception is an instance
    of a type defined in `reraise`, it will be re-raised. Otherwise, it will log
    the error and return the generic user-facing message `default_message`.

    Args:
        reraise (tuple[type[Exception], ...], optional): Exceptions to re-raise.
        default_message (str, optional): User-facing fallback message.

    Returns:
        Callable[[Callable[..., Any]], Callable[..., Any]]: The wrapped decorator function.
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await func(*args, **kwargs)
            except reraise:
                raise
            except Exception:
                # We log at exception level to preserve the traceback
                logger.exception("Error in %s", getattr(func, "__qualname__", repr(func)))
                return default_message

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except reraise:
                raise
            except Exception:
                logger.exception("Error in %s", getattr(func, "__qualname__", repr(func)))
                return default_message

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
