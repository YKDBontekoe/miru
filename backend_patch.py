import re

with open("backend/app/domain/agents/models.py", "r") as f:
    content = f.read()

# Make sure name and personality require at least 1 character (after stripping)
content = re.sub(
    r'name: str = Field\(max_length=100\)',
    r'name: str = Field(min_length=1, max_length=100, json_schema_extra={"strip_whitespace": True})',
    content
)

content = re.sub(
    r'personality: str = Field\(max_length=1000\)',
    r'personality: str = Field(min_length=1, max_length=1000, json_schema_extra={"strip_whitespace": True})',
    content
)

with open("backend/app/domain/agents/models.py", "w") as f:
    f.write(content)
