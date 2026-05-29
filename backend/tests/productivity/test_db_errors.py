from __future__ import annotations

import pytest
from tortoise.exceptions import IntegrityError

from app.infrastructure.database.utils import handle_db_errors


@pytest.mark.asyncio
async def test_handle_db_errors_integrity():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("create test"):
            raise IntegrityError("mock integrity error")
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_handle_db_errors_connection_does_not_exist():
    import asyncpg.exceptions
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("update task"):
            raise asyncpg.exceptions.ConnectionDoesNotExistError("connection was closed")
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_handle_db_errors_unexpected():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("list test"):
            raise ValueError("mock generic error")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("update test"):
            raise KeyError("mock key error")
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_handle_db_errors_httpexception():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("delete test"):
            raise HTTPException(status_code=400, detail="existing error")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_handle_db_errors_action_mapping():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        async with handle_db_errors("list notes"):
            raise IntegrityError("mock error")
    assert "listing notes" in exc_info.value.detail["message"]
@pytest.mark.asyncio
async def test_handle_db_errors_value_error():
    from app.infrastructure.database.utils import handle_db_errors
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        async with handle_db_errors("test validation"):
            raise ValueError("Test Error")

    assert exc.value.status_code == 400
    assert exc.value.detail["message"] == "Validation error occurred"
@pytest.mark.asyncio
async def test_handle_db_errors_integrity_error():
    from app.infrastructure.database.utils import handle_db_errors
    from fastapi import HTTPException
    from tortoise.exceptions import IntegrityError

    with pytest.raises(HTTPException) as exc:
        async with handle_db_errors("test creation"):
            raise IntegrityError("Test Integrity Error")

    assert exc.value.status_code == 500
    assert exc.value.detail["message"] == "Database error occurred while testing creation"

@pytest.mark.asyncio
async def test_handle_db_errors_general_error():
    from app.infrastructure.database.utils import handle_db_errors
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        async with handle_db_errors("test execution"):
            raise Exception("General Execution Error")

    assert exc.value.status_code == 500
    assert exc.value.detail["message"] == "Internal server error"
