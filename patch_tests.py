import re

with open('backend/tests/test_auth.py', 'r') as f:
    content = f.read()

new_tests = '''
@pytest.mark.asyncio
async def test_decode_jwt_with_jwks_happy_path() -> None:
    """A valid asymmetric JWT decodes successfully using a mocked JWKS key."""
    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository
    from unittest.mock import patch

    # Create an asymmetric keypair
    private_key_pem = jwt.algorithms.RSAAlgorithm.generate_key(2048)
    public_key_pem = private_key_pem.public_key()

    # Create a token signed with the private key
    headers = {"kid": "mock_kid"}
    payload = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "role": "authenticated",
        "exp": 9999999999,
        "iat": 1516239022
    }
    token = jwt.encode(payload, private_key_pem, algorithm="RS256", headers=headers)

    # Mock the JWK Client to return our public key
    mock_signing_key = MagicMock()
    mock_signing_key.key = public_key_pem

    with patch("jwt.PyJWKClient.get_signing_key_from_jwt", return_value=mock_signing_key):
        verifier = SupabaseJWTVerifier()
        service = AuthService(AuthRepository(MagicMock()), verifier)
        decoded = await service.decode_jwt(token)

        assert isinstance(decoded, JWTPayload)
        assert str(decoded.sub) == payload["sub"]
        assert decoded.role == "authenticated"


@pytest.mark.asyncio
async def test_decode_jwt_with_jwks_failure(caplog: pytest.LogCaptureFixture) -> None:
    """An asymmetric JWT failing JWKS verification raises an exception and logs it."""
    import logging
    from app.domain.auth.service import AuthService
    from app.infrastructure.repositories.auth_repo import AuthRepository
    from unittest.mock import patch

    # Create a dummy ES256 token (no valid signature needed since we'll mock the exception)
    token = jwt.encode({"sub": "test"}, "secret", algorithm="HS256")
    # Hack the header to look like ES256 to force the JWKS branch
    header = jwt.utils.base64url_encode(b'{"alg": "ES256", "kid": "bad"}').decode('ascii')
    token = f"{header}.{token.split('.')[1]}.{token.split('.')[2]}"

    with patch(
        "jwt.PyJWKClient.get_signing_key_from_jwt",
        side_effect=jwt.PyJWKClientError("Unable to find a signing key that matches")
    ):
        verifier = SupabaseJWTVerifier()
        service = AuthService(AuthRepository(MagicMock()), verifier)

        with (
            caplog.at_level(logging.ERROR),
            pytest.raises(jwt.PyJWKClientError, match="Unable to find a signing key"),
        ):
            await service.decode_jwt(token)

        assert any(
            record.levelname == "ERROR" and "JWT validation failed" in record.message
            for record in caplog.records
        )
'''

content = content.replace("def test_memories_requires_auth(client: TestClient) -> None:", f"{new_tests}\n\ndef test_memories_requires_auth(client: TestClient) -> None:")

with open('backend/tests/test_auth.py', 'w') as f:
    f.write(content)
