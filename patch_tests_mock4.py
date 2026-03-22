files = [
    "backend/tests/test_events_tools.py"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace('patch(\n        "app.domain.agent_tools.productivity.events_tools.ManageProductivityUseCase"\n    )', 'patch(\n        "app.domain.agent_tools.productivity.events_tools.get_productivity_use_case"\n    )')

    with open(filepath, "w") as f:
        f.write(content)
