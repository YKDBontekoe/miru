import os
from datetime import UTC, datetime, timedelta

import jwt


def generate_test_token(secret: str, user_id: str = "00000000-0000-0000-0000-000000000001"):
    payload = {
        "sub": user_id,
        "email": "test@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(datetime.now(UTC).timestamp()),
        "exp": int((datetime.now(UTC) + timedelta(hours=1)).timestamp()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


if __name__ == "__main__":
    jwt_secret = os.getenv(
        "SUPABASE_JWT_SECRET", "ci-test-secret-must-be-at-least-32-chars-long-123456"
    )
    token = generate_test_token(jwt_secret)
    print(token)
