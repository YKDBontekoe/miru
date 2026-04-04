from __future__ import annotations

import functools
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
                logger.exception("Error in %s", func.__qualname__)
                return default_message

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except reraise:
                raise
            except Exception:
                logger.exception("Error in %s", func.__qualname__)
                return default_message

        if (
            getattr(func, "__code__", None)
            and func.__code__.co_flags & 0x80
            or getattr(func, "_is_coroutine", False)
        ):
            return async_wrapper
        else:
            # Better check for async
            import inspect

            if inspect.iscoroutinefunction(func):
                return async_wrapper
            return sync_wrapper

    return decorator
