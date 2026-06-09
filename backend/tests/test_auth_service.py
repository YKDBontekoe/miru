"""Tests for auth service."""

from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.auth.entities import Passkey
from app.domain.auth.service import AuthService


@pytest.mark.asyncio
async def test_auth_service_list_passkeys():
    repo = AsyncMock()
    user_id = uuid4()
    mock_passkeys = [
        Passkey(
            id=uuid4(), user_id=user_id, credential_id="cred_id", public_key="pub_key", sign_count=0
        )
    ]
    repo.get_passkeys_by_user.return_value = (mock_passkeys, "next_cursor")

    service = AuthService(repo)
    passkeys, cursor = await service.list_passkeys(user_id, limit=10, cursor="cursor")

    assert passkeys == mock_passkeys
    assert cursor == "next_cursor"
    repo.get_passkeys_by_user.assert_called_once_with(user_id, limit=10, cursor="cursor")


@pytest.mark.asyncio
async def test_auth_service_delete_passkey():
    repo = AsyncMock()
    user_id = uuid4()
    passkey_id = str(uuid4())
    repo.delete_passkey.return_value = True

    service = AuthService(repo)
    result = await service.delete_passkey(passkey_id, user_id)

    assert result is True
    repo.delete_passkey.assert_called_once_with(passkey_id, user_id)


@pytest.mark.asyncio
async def test_auth_service_verify_registration():
    repo = AsyncMock()
    service = AuthService(repo)
    result = await service.verify_registration("challenge", "json")
    assert result is None
