import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Check if line is a route decorator
        match = re.search(r'^\s*@router\.(get|post|put|delete|patch|websocket|head|options)\(', line)
        if match:
            # Check if previous line is already the DOCS comment
            if len(new_lines) > 0 and '# DOCS(miru-agent): undocumented endpoint' in new_lines[-1]:
                # Already documented
                pass
            else:
                # Need to find the associated function definition to check for docstring
                # The function definition might be immediately after or a few lines down (e.g. if decorators are stacked)
                func_idx = -1
                for j in range(i + 1, min(i + 10, len(lines))):
                    if re.match(r'^\s*(async\s+)?def\s+\w+\(', lines[j]):
                        func_idx = j
                        break

                if func_idx != -1:
                    # Check for docstring inside the function
                    has_docstring = False
                    for j in range(func_idx + 1, min(func_idx + 10, len(lines))):
                        # skip empty lines or lines that are just closing parens or return types from the def
                        stripped = lines[j].strip()
                        if not stripped:
                            continue
                        if stripped.startswith('"""') or stripped.startswith("'''"):
                            has_docstring = True
                            break
                        # if we hit actual code before a docstring, we consider it undocumented
                        if not stripped.startswith(')') and not stripped.startswith('->') and not stripped.startswith(':'):
                            break

                    if not has_docstring:
                        # Find the first decorator of this block to insert the comment above it
                        first_decorator_idx = i
                        while first_decorator_idx > 0 and lines[first_decorator_idx-1].strip().startswith('@'):
                            first_decorator_idx -= 1

                        # Insert the comment
                        new_lines.insert(first_decorator_idx, '# DOCS(miru-agent): undocumented endpoint\n')
        new_lines.append(line)
        i += 1

    with open(filepath, 'w') as f:
        f.writelines(new_lines)

directories = ['backend/app/api/v1', 'backend/app/domain/notifications/api']

for directory in directories:
    if os.path.exists(directory):
        for filename in os.listdir(directory):
            if filename.endswith('.py'):
                filepath = os.path.join(directory, filename)
                process_file(filepath)
