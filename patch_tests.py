import re

files = [
    "backend/tests/test_events_tools.py",
    "backend/tests/test_tasks_tools.py",
    "backend/tests/test_notes_tools.py"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace("app.domain.agent_tools.productivity.events_tools.get_productivity_use_case", "app.domain.productivity.dependencies.get_productivity_use_case")
    content = content.replace("app.domain.agent_tools.productivity.tasks_tools.get_productivity_use_case", "app.domain.productivity.dependencies.get_productivity_use_case")
    content = content.replace("app.domain.agent_tools.productivity.notes_tools.get_productivity_use_case", "app.domain.productivity.dependencies.get_productivity_use_case")

    with open(filepath, "w") as f:
        f.write(content)

filepath = "backend/tests/test_productivity.py"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace('assert "end_time must be greater than start_time" in response.json()["detail"]', 'assert "end_time must be after start_time" in response.json()["detail"]["message"]')

with open(filepath, "w") as f:
    f.write(content)
