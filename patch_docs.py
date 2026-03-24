import os
import re

directory = 'backend/app/api/v1'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to find route definitions (e.g. @router.get("/..."))
    # Followed optionally by async def or def and then the docstring.
    # We will look for routes that do not have a """ docstring immediately following the def line

    lines = content.split('\n')
    new_lines = []

    in_route = False
    route_decorator = None
    route_idx = -1

    for i, line in enumerate(lines):
        if re.match(r'^\s*@router\.(get|post|put|delete|patch|websocket)\(', line):
            # Potential route decorator. Check if it already has DOCS comment above
            if i > 0 and '# DOCS(miru-agent): undocumented endpoint' in lines[i-1]:
                # already tagged
                pass
            else:
                in_route = True
                route_idx = i

        if in_route and re.match(r'^\s*(async\s+)?def\s+\w+\(', line):
            # This is the function definition. Check the next lines for a docstring
            has_docstring = False
            for j in range(i+1, min(i+5, len(lines))):
                if '"""' in lines[j] or "'''" in lines[j]:
                    has_docstring = True
                    break
                if lines[j].strip() != '' and not lines[j].strip().startswith(')') and not lines[j].strip().startswith('->'):
                    break # hit actual code

            if not has_docstring:
                # Insert comment before the decorator
                new_lines.insert(route_idx, '# DOCS(miru-agent): undocumented endpoint')

            in_route = False

        new_lines.append(line)

    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))

for filename in os.listdir(directory):
    if filename.endswith('.py'):
        process_file(os.path.join(directory, filename))

# also check the other route file location found earlier: backend/app/domain/notifications/api/router.py
process_file('backend/app/domain/notifications/api/router.py')
