files = [
    "backend/tests/test_events_tools.py",
    "backend/tests/test_tasks_tools.py",
    "backend/tests/test_notes_tools.py"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace('patch("app.domain.agent_tools.productivity.events_tools.ManageProductivityUseCase")', 'patch("app.domain.agent_tools.productivity.events_tools.get_productivity_use_case")')
    content = content.replace('patch("app.domain.agent_tools.productivity.tasks_tools.ManageProductivityUseCase")', 'patch("app.domain.agent_tools.productivity.tasks_tools.get_productivity_use_case")')
    content = content.replace('patch("app.domain.agent_tools.productivity.notes_tools.ManageProductivityUseCase")', 'patch("app.domain.agent_tools.productivity.notes_tools.get_productivity_use_case")')

    with open(filepath, "w") as f:
        f.write(content)
