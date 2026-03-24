import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    new_lines = []
    i = 0
    while i < len(lines):
        if '# DOCS(miru-agent): undocumented endpoint' in lines[i]:
            # skip if the next line is also the same tag
            if i + 1 < len(lines) and '# DOCS(miru-agent): undocumented endpoint' in lines[i+1]:
                i += 1
                continue
        new_lines.append(lines[i])
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
