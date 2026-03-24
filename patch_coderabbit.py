import re
with open('.coderabbit.yaml', 'r') as f:
    content = f.read()

content = re.sub(r'\s*State management uses flutter_riverpod \(Riverpod\) with riverpod_annotation for code generation.', '\n        State management uses Zustand.', content)

with open('.coderabbit.yaml', 'w') as f:
    f.write(content)
