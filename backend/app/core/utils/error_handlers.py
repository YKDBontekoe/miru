from __future__ import annotations

import functools
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


def handle_tool_error(reraise: tuple[type[Exception], ...] = ()) -> Callable:
    """Decorator to handle exceptions in tools, logging them and returning a safe message."""

    def decorator(func: Callable) -> Callable:
        import asyncio

        if asyncio.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                try:
                    return await func(*args, **kwargs)
                except reraise:
                    raise
                except Exception:
                    logger.exception(f"Error executing {getattr(func, '__name__', repr(func))}")
                    return "An unexpected error occurred while executing the tool."

            return async_wrapper
        else:

            @functools.wraps(func)
            def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                try:
                    return func(*args, **kwargs)
                except reraise:
                    raise
                except Exception:
                    logger.exception(f"Error executing {getattr(func, '__name__', repr(func))}")
                    return "An unexpected error occurred while executing the tool."

            return sync_wrapper

    return decorator
