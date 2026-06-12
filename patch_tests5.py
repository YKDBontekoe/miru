with open('backend/tests/test_auth.py', 'r') as f:
    content = f.read()

# I see the previous patch failed to replace the string because my old string didn't perfectly match what was in the file, probably due to indentation or comments.

import re

# Use regex to replace the assertion block more robustly
pattern = r'with \(\s*caplog\.at_level\(logging\.ERROR\),\s*pytest\.raises\(jwt\.PyJWKClientError, match="Unable to find a signing key"\),\s*\):\s*await service\.decode_jwt\(token\)\s*assert any\(\s*record\.levelname == "ERROR" and "JWT validation failed" in record\.message\s*for record in caplog\.records\s*\)'

replacement = '''with (
            caplog.at_level(logging.WARNING),
            pytest.raises(jwt.PyJWKClientError, match="Unable to find a signing key"),
        ):
            await service.decode_jwt(token)

        assert any(
            record.levelname == "WARNING" and "JWT validation failed" in record.message
            for record in caplog.records
        )'''

content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

with open('backend/tests/test_auth.py', 'w') as f:
    f.write(content)
