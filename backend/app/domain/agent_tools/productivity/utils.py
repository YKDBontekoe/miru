from __future__ import annotations

import functools
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


def handle_tool_error(
    error_message: str, reraise: tuple[type[Exception], ...] = ()
) -> Callable[..., Callable[..., Any]]:
    """Decorator to handle common tool errors and log exceptions."""

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(self: Any, *args: Any, **kwargs: Any) -> str:
            try:
                return await func(self, *args, **kwargs)
            except reraise:
                raise
            except Exception:
                logger.exception(f"Error in {self.__class__.__name__}")
                return error_message

        return wrapper

    return decorator
