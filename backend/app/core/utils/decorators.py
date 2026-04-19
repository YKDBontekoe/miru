from __future__ import annotations

import functools
import inspect
import logging
from collections.abc import Callable
from typing import Any, TypeVar

T = TypeVar("T")


def handle_tool_error(
    logger: logging.Logger,
    return_message: str = "An error occurred while executing the tool.",
    reraise: tuple[type[Exception], ...] = (),
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """A decorator to catch exceptions in tool execution.

    Logs the exception and returns a generic user-facing message.
    Optionally reraises specific exceptions.

    Args:
        logger: The logger instance to record the exception.
        return_message: The generic message returned to the user when an exception occurs.
        reraise: An optional tuple of exception types that should be re-raised instead of caught.

    Returns:
        A Callable wrapper that executes the decorated function and returns either its result or a
        user-facing error string.

    Raises:
        Exception: Any exception specified in the `reraise` tuple will be re-raised.
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if reraise and isinstance(e, reraise):
                        raise
                    func_name = getattr(func, "__name__", repr(func))
                    logger.exception(f"Error in {func_name}")
                    return return_message

            return async_wrapper
        else:

            @functools.wraps(func)
            def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if reraise and isinstance(e, reraise):
                        raise
                    func_name = getattr(func, "__name__", repr(func))
                    logger.exception(f"Error in {func_name}")
                    return return_message

            return sync_wrapper

    return decorator
