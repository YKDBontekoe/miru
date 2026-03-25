import json
import re
import subprocess
import sys
from pathlib import Path


def get_postman_endpoints(collection_path: str) -> set:
    try:
        with open(collection_path, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading Postman collection: {e}")
        sys.exit(1)

    endpoints = set()

    def extract_items(items: list) -> None:
        for item in items:
            if "item" in item:
                extract_items(item["item"])
            elif "request" in item:
                req = item["request"]
                method = req.get("method", "").upper()
                url = req.get("url", {})
                if isinstance(url, dict):
                    path_parts = url.get("path", [])
                    if isinstance(path_parts, list):
                        path_str = "/" + "/".join(path_parts)
                    else:
                        path_str = str(url.get("raw", ""))
                elif isinstance(url, str):
                    path_str = url
                else:
                    path_str = ""

                path_str = re.sub(r"^\{\{.*?\}\}", "", path_str)
                if not path_str.startswith("/"):
                    path_str = "/" + path_str

                path_str = re.sub(r"\{\{.*?\}\}", "{param}", path_str)
                path_str = re.sub(r":[a-zA-Z0-9_]+", "{param}", path_str)
                path_str = path_str.rstrip("/")

                endpoints.add((method, path_str))

    extract_items(data.get("item", []))
    return endpoints


def extract_added_routes() -> list:
    try:
        diff_output = subprocess.check_output(
            [
                "git",
                "diff",
                "--unified=0",
                "origin/main...HEAD",
                "--",
                "backend/app/api/",
                "backend/app/domain/",
            ],
            text=True,
        )
    except subprocess.CalledProcessError:
        try:
            diff_output = subprocess.check_output(
                [
                    "git",
                    "diff",
                    "--unified=0",
                    "HEAD",
                    "--",
                    "backend/app/api/",
                    "backend/app/domain/",
                ],
                text=True,
            )
        except subprocess.CalledProcessError:
            diff_output = ""

    added_routes = []

    current_file = ""
    for line in diff_output.splitlines():
        if line.startswith("+++ b/"):
            current_file = line[6:]
        elif line.startswith("+@router."):
            match = re.search(r'\+@router\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]', line)
            if match:
                method = match.group(1).upper()
                path = match.group(2)

                prefix = ""
                if "api/v1/auth.py" in current_file:
                    prefix = "/api/v1/auth"
                elif "api/v1/agents.py" in current_file:
                    prefix = "/api/v1/agents"
                elif "api/v1/chat.py" in current_file:
                    prefix = "/api/v1"
                elif "api/v1/memory.py" in current_file:
                    prefix = "/api/v1/memory"
                elif "api/v1/productivity.py" in current_file:
                    prefix = "/api/v1/productivity"
                elif "api/v1/integrations.py" in current_file:
                    prefix = "/api/v1/integrations"
                elif "notifications" in current_file:
                    prefix = "/api/v1/notifications"

                full_path = prefix + path
                full_path = re.sub(r"\{[a-zA-Z0-9_]+\}", "{param}", full_path)
                full_path = full_path.rstrip("/")

                added_routes.append((method, full_path, current_file))

    return added_routes


def main() -> None:
    postman_dir = Path("backend/tests/postman")
    if not postman_dir.exists() or not postman_dir.is_dir():
        print(f"Postman collections directory not found at {postman_dir}")
        sys.exit(1)

    postman_endpoints = set()
    for json_file in postman_dir.glob("*.json"):
        # Skip the Postman environment file — it has no collection items.
        if json_file.name == "environment.json":
            continue
        postman_endpoints.update(get_postman_endpoints(str(json_file)))

    added_routes = extract_added_routes()

    if not added_routes:
        print("No new routes detected in this PR.")
        sys.exit(0)

    missing = []
    for method, path, source_file in added_routes:
        if (method, path) not in postman_endpoints:
            found = False
            for pm_method, pm_path in postman_endpoints:
                if method == pm_method and path in pm_path:
                    found = True
                    break

            if not found:
                missing.append((method, path, source_file))

    if missing:
        print(
            "::error title=Missing Postman Integration Tests::New endpoints detected without corresponding Postman tests in backend/tests/postman/*.json!"
        )
        for method, path, source_file in missing:
            print(f"::error file={source_file}::Missing Postman test for {method} {path}")
        print(
            "\nPlease add these endpoints to one of the JSON collections in backend/tests/postman/"
        )
        sys.exit(1)

    print("All new endpoints have Postman tests. Great job!")


if __name__ == "__main__":
    main()
