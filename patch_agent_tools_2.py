files = [
    "backend/app/domain/agent_tools/productivity/tasks_tools.py",
    "backend/app/domain/agent_tools/productivity/notes_tools.py"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace(
        "from app.domain.productivity.use_cases.manage_productivity import ManageProductivityUseCase\nfrom app.infrastructure.repositories.productivity_repo import ProductivityRepository\n\n\ndef get_productivity_use_case() -> ManageProductivityUseCase:\n    return ManageProductivityUseCase(repository=ProductivityRepository())",
        "from app.domain.productivity.dependencies import get_productivity_use_case"
    )

    with open(filepath, "w") as f:
        f.write(content)
