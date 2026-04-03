def fix_indent(path):
    with open(path, "r") as f:
        lines = f.readlines()

    in_run = False
    for i, line in enumerate(lines):
        if "async def _run" in line:
            in_run = True
            continue
        if line.strip().startswith("class ") and "(BaseModel)" in line:
            in_run = False

        if in_run and line.startswith("            "):
            lines[i] = line[4:]

    with open(path, "w") as f:
        f.writelines(lines)

fix_indent("backend/app/domain/agent_tools/productivity/events_tools.py")
fix_indent("backend/app/domain/agent_tools/productivity/tasks_tools.py")
fix_indent("backend/app/domain/agent_tools/productivity/notes_tools.py")
