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


def create_test_user(user_id: str):
    import subprocess

    db_url = os.getenv("DATABASE_URL", "postgres://miru:miru@localhost:5432/miru")
    sql = f"INSERT INTO auth.users (id, email) VALUES ('{user_id}', 'test@example.com') ON CONFLICT (id) DO NOTHING;"
    subprocess.run(["psql", db_url, "-c", sql], capture_output=True)


if __name__ == "__main__":
    jwt_secret = os.getenv(
        "SUPABASE_JWT_SECRET", "ci-test-secret-must-be-at-least-32-chars-long-123456"
    )
    test_user_id = "00000000-0000-0000-0000-000000000001"
    create_test_user(test_user_id)
    token = generate_test_token(jwt_secret, test_user_id)
    print(token)
