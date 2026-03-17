with open("backend/app/api/v1/chat.py", "r") as f:
    text = f.read()

# I accidentally added "import hashlib\nimport hmac\nimport logging" AT the very top (line 1), above from __future__
text = text.replace("import hashlib\nimport hmac\nimport logging\n\"\"\"Chat API router v1.\"\"\"", "\"\"\"Chat API router v1.\"\"\"\n\nimport hashlib\nimport hmac\nimport logging")

text = text.replace("import hashlib\nimport hmac\nimport logging\nfrom __future__ import annotations", "from __future__ import annotations\nimport hashlib\nimport hmac\nimport logging")

# Let's just fix it manually
lines = text.split("\n")
imports = []
new_lines = []
for line in lines:
    if line in ["import hashlib", "import hmac", "import logging"]:
        imports.append(line)
    else:
        new_lines.append(line)

final_text = "\n".join(new_lines)
final_text = final_text.replace("from __future__ import annotations", "from __future__ import annotations\n\nimport hashlib\nimport hmac\nimport logging")

with open("backend/app/api/v1/chat.py", "w") as f:
    f.write(final_text)
