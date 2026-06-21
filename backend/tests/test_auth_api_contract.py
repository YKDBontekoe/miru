from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.domain.auth.schemas import (
    PasskeyLoginOptionsRequest,
    PasskeyLoginVerifyRequest,
    PasskeyRegisterOptionsRequest,
    PasskeyRegisterVerifyRequest,
)


def test_contract_passkey_register_options() -> None:
    # Missing required field not present here, all fields optional or not missing? Let's check schemas
    # PasskeyRegisterOptionsRequest device_name: str | None = None
    data = {"device_name": "My Device"}
    obj = PasskeyRegisterOptionsRequest(**data)
    assert obj.device_name == "My Device"


def test_contract_passkey_register_verify() -> None:
    # Missing required challenge_id
    with pytest.raises(ValidationError):
        PasskeyRegisterVerifyRequest(**{"credential": "{}"})

    data = {"challenge_id": "ch1", "credential": "{}"}
    obj = PasskeyRegisterVerifyRequest(**data)
    assert obj.challenge_id == "ch1"


def test_contract_passkey_login_options() -> None:
    # Missing required email
    with pytest.raises(ValidationError):
        PasskeyLoginOptionsRequest(**{})

    data = {"email": "test@test.com"}
    obj = PasskeyLoginOptionsRequest(**data)
    assert obj.email == "test@test.com"


def test_contract_passkey_login_verify() -> None:
    # Missing credential
    with pytest.raises(ValidationError):
        PasskeyLoginVerifyRequest(**{"challenge_id": "ch1"})

    data = {"challenge_id": "ch1", "credential": "{}"}
    obj = PasskeyLoginVerifyRequest(**data)
    assert obj.challenge_id == "ch1"
