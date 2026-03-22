import json
import os
import sys
import urllib.error
import urllib.request


def seed_user() -> None:
    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    email = os.environ.get("SUPABASE_TEST_EMAIL")
    password = os.environ.get("SUPABASE_TEST_PASSWORD")

    if not supabase_url or not service_key or not email or not password:
        print("Missing required Supabase environment variables.")
        sys.exit(1)

    headers: dict[str, str] = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    # 1. Check if user exists
    get_req = urllib.request.Request(
        f"{supabase_url}/auth/v1/admin/users", headers=headers, method="GET"
    )

    user_id = None
    try:
        with urllib.request.urlopen(get_req) as response:
            data = json.loads(response.read())
            users = data.get("users", [])
            for u in users:
                if u.get("email") == email:
                    user_id = u.get("id")
                    break
    except urllib.error.URLError as e:
        print(f"Failed to fetch users: {e}")
        sys.exit(1)

    if user_id:
        print(f"User {email} already exists with ID {user_id}. Updating password and confirming.")
        update_data = json.dumps({"password": password, "email_confirm": True}).encode("utf-8")

        update_req = urllib.request.Request(
            f"{supabase_url}/auth/v1/admin/users/{user_id}",
            data=update_data,
            headers=headers,
            method="PUT",
        )
        try:
            with urllib.request.urlopen(update_req) as response:
                print("Successfully updated user.")
        except urllib.error.URLError as e:
            print(f"Failed to update user: {e}")
            sys.exit(1)
    else:
        print(f"User {email} does not exist. Creating and confirming.")
        create_data = json.dumps(
            {"email": email, "password": password, "email_confirm": True}
        ).encode("utf-8")

        create_req = urllib.request.Request(
            f"{supabase_url}/auth/v1/admin/users", data=create_data, headers=headers, method="POST"
        )
        try:
            with urllib.request.urlopen(create_req) as response:
                print("Successfully created user.")
        except urllib.error.URLError as e:
            print(f"Failed to create user: {e}")
            if hasattr(e, "read"):
                print(e.read().decode("utf-8"))
            sys.exit(1)


if __name__ == "__main__":
    seed_user()
