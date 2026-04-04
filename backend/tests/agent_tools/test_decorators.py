from __future__ import annotations

import logging
from typing import Any

import pytest

from app.domain.agent_tools.decorators import handle_tool_error


class CustomError(Exception):
    pass


class AnotherError(Exception):
    pass


@pytest.mark.asyncio
async def test_handle_tool_error_async_success() -> None:
    @handle_tool_error(default_message="Error.")
    async def my_func() -> str:
        return "Success"

    result = await my_func()
    assert result == "Success"


def test_handle_tool_error_sync_success() -> None:
    @handle_tool_error(default_message="Error.")
    def my_func() -> str:
        return "Success"

    result = my_func()
    assert result == "Success"


@pytest.mark.asyncio
async def test_handle_tool_error_async_catches_exception(caplog: Any) -> None:
    @handle_tool_error(default_message="Caught async.")
    async def my_func() -> str:
        raise ValueError("Something went wrong")

    with caplog.at_level(logging.ERROR):
        result = await my_func()

    assert result == "Caught async."
    assert "Error in " in caplog.text


def test_handle_tool_error_sync_catches_exception(caplog: Any) -> None:
    @handle_tool_error(default_message="Caught sync.")
    def my_func() -> str:
        raise ValueError("Something went wrong")

    with caplog.at_level(logging.ERROR):
        result = my_func()

    assert result == "Caught sync."
    assert "Error in " in caplog.text


@pytest.mark.asyncio
async def test_handle_tool_error_reraises_specified_exception() -> None:
    @handle_tool_error(reraise=(CustomError,), default_message="Should not be returned")
    async def my_func() -> str:
        raise CustomError("Reraise me")

    with pytest.raises(CustomError, match="Reraise me"):
        await my_func()


def test_handle_tool_error_sync_reraises_specified_exception() -> None:
    @handle_tool_error(reraise=(CustomError,), default_message="Should not be returned")
    def my_func() -> str:
        raise CustomError("Reraise me")

    with pytest.raises(CustomError, match="Reraise me"):
        my_func()


@pytest.mark.asyncio
async def test_handle_tool_error_catches_unspecified_exception() -> None:
    @handle_tool_error(reraise=(CustomError,), default_message="Default message")
    async def my_func() -> str:
        raise AnotherError("Do not reraise me")

    result = await my_func()
    assert result == "Default message"
