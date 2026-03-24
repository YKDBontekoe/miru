import re

with open('.github/dependabot.yml', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "Dart/Flutter dependencies" in line:
        # We replace this entry with npm entry since it's missing (assume React Native uses npm)
        new_lines.append("  # React Native dependencies\n")
        new_lines.append("  - package-ecosystem: \"npm\"\n")
        new_lines.append("    directory: \"/frontend\"\n")
        new_lines.append("    schedule:\n")
        new_lines.append("      interval: \"weekly\"\n")
        skip = True
        continue

    if skip:
        # Stop skipping if we hit the next block (another ecosystem) or end of file
        if line.startswith("  - package-ecosystem:"):
            skip = False
            new_lines.append(line)
        elif line.strip() == "":
            pass # ignore
        elif not line.startswith("    ") and not line.startswith("  "):
             skip = False
             new_lines.append(line)
        continue
    new_lines.append(line)

with open('.github/dependabot.yml', 'w') as f:
    f.writelines(new_lines)
