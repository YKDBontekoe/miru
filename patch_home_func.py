import re

with open("frontend/app/(main)/home.tsx", "r") as f:
    content = f.read()

content = re.sub(r"function getGreeting\(hour: number\): string \{", "function getGreeting(hour: number, t: any): string {", content)
content = re.sub(r"const greeting = getGreeting\(hour\);", "const greeting = getGreeting(hour, t);", content)

with open("frontend/app/(main)/home.tsx", "w") as f:
    f.write(content)
