import re

with open('.gitignore', 'r') as f:
    content = f.read()

content = re.sub(r'# Flutter / Dart Frontend\n.*?# Backend', '# Backend', content, flags=re.DOTALL)
content = re.sub(r'# Flutter/Dart specific\n.*?# Backend', '# Backend', content, flags=re.DOTALL)
content = re.sub(r'\*\*/ios/Flutter/.*?#', '#', content, flags=re.DOTALL)
content = re.sub(r'\*\*/macos/Flutter/.*?#', '#', content, flags=re.DOTALL)

with open('.gitignore', 'w') as f:
    f.write(content)
