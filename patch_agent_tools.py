import sys

files = [
    "backend/app/domain/agent_tools/productivity/events_tools.py"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace("from app.domain.productivity.dependencies import get_productivity_use_case", "from app.domain.productivity.dependencies import get_productivity_use_case\nfrom app.domain.productivity.use_cases.manage_productivity import CalendarEventNotFoundError, InvalidTimeRangeError\n")

    with open(filepath, "w") as f:
        f.write(content)
