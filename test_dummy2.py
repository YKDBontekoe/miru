with open("backend/app/routes.py", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if i in [103, 104, 105, 106, 107]:
        print(f"{i}: {line}", end="")
