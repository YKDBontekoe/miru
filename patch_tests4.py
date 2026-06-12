with open('backend/tests/test_auth.py', 'r') as f:
    content = f.read()

# Notice that the `caplog.at_level(logging.ERROR)` in the test causes WARNING level logs to be suppressed!
# We need to change it to `caplog.at_level(logging.WARNING)` because PyJWKClientError is caught by `except jwt.PyJWTError:`
# and logged as WARNING.

old_failure_block = '''        with patch(
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

new_failure_block = '''        with patch(
            "jwt.PyJWKClient.get_signing_key_from_jwt",
            side_effect=jwt.PyJWKClientError("Unable to find a signing key that matches")
        ):
            verifier = SupabaseJWTVerifier()
            service = AuthService(AuthRepository(MagicMock()), verifier)

            with (
                caplog.at_level(logging.WARNING),
                pytest.raises(jwt.PyJWKClientError, match="Unable to find a signing key"),
            ):
                await service.decode_jwt(token)

            assert any(
                record.levelname == "WARNING" and "JWT validation failed" in record.message
                for record in caplog.records
            )
'''

content = content.replace(old_failure_block, new_failure_block)

with open('backend/tests/test_auth.py', 'w') as f:
    f.write(content)
