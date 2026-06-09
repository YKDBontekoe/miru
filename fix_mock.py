with open("backend/tests/test_auth.py", "r") as f:
    code = f.read()

code = code.replace("verifier.verify_token.return_value = fake_payload", "verifier.verify_token.return_value = fake_payload\n    import asyncio\n    future = asyncio.Future()\n    future.set_result(fake_payload)\n    verifier.verify_token.return_value = future")

with open("backend/tests/test_auth.py", "w") as f:
    f.write(code)
