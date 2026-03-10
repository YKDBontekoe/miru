import re

with open("backend/app/routes.py", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if i in [351, 352, 353, 354, 355, 356, 357, 358, 359, 360]:
        print(f"{i}: {line}", end="")
