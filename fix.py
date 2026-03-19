with open("backend/tests/test_productivity.py", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'assert "listing notes"' in line:
        lines[i] = line.rstrip() + "  # type: ignore[unreachable]\n"

with open("backend/tests/test_productivity.py", "w") as f:
    f.writelines(lines)
