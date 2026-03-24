import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    new_lines = []
    i = 0
    # look for export const ComponentName or const ComponentName or export function ComponentName
    # if it doesn't have a jsdoc right above it (starting with /**), add // DOCS(miru-agent): needs documentation
    while i < len(lines):
        line = lines[i]

        # very basic match for component exports
        match = re.search(r'^\s*(export\s+)?(const|function)\s+([A-Z]\w+)\s*(=|\()', line)

        # if in store dir, match useHooks
        if 'src/store' in filepath:
             match = re.search(r'^\s*(export\s+)?(const|function)\s+(use[A-Z]\w+)\s*(=|\()', line)

        if match:
            # check backwards for JSDoc
            has_doc = False

            # Check if we already added a needs documentation comment
            already_tagged = False
            for j in range(i-1, max(-1, i-5), -1):
                stripped = lines[j].strip()
                if not stripped:
                    continue
                if stripped.startswith('// DOCS(miru-agent): needs documentation'):
                    already_tagged = True
                    break
                if stripped.endswith('*/'):
                    has_doc = True
                    break
                if stripped.startswith('//'):
                     # inline comment, maybe docs, let's keep searching backwards but not strictly JSDoc
                     pass
                else:
                    # we hit something that isn't a comment
                    break

            if not has_doc and not already_tagged:
                new_lines.append('// DOCS(miru-agent): needs documentation\n')

        new_lines.append(line)
        i += 1

    with open(filepath, 'w') as f:
        f.writelines(new_lines)

for root, _, files in os.walk('frontend/src/components'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

for root, _, files in os.walk('frontend/src/store'):
    for file in files:
        if file.endswith('.ts'):
            process_file(os.path.join(root, file))
