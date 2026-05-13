with open("frontend/src/hooks/viewmodels/useProductivityViewModel.ts", "r") as f:
    lines = f.readlines()

with open("frontend/src/hooks/viewmodels/useProductivityViewModel.ts", "w") as f:
    skip = False
    for i, line in enumerate(lines):
        if skip:
            skip = False
            continue
        if "setTodayPlan(lines.join('" in line and i + 1 < len(lines) and "'));" in lines[i+1]:
            f.write("    setTodayPlan(lines.join('\\n'));\n")
            skip = True
        else:
            f.write(line)
