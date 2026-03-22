import re

filepath = "backend/pyproject.toml"

with open(filepath, "r") as f:
    content = f.read()

# Remove the test dependencies accidentally added to project.dependencies
content = re.sub(r'\s*"pytest>=9\.0\.2",\n', '\n', content)
content = re.sub(r'\s*"pytest-asyncio>=1\.3\.0",\n', '\n', content)
content = re.sub(r'\s*"pytest-cov>=7\.0\.0",\n', '\n', content)

# Remove the duplicates in optional dev dependencies if they exist
content = re.sub(r'\s*"pytest>=8\.2\.0",\n', '\n', content)
content = re.sub(r'\s*"pytest-asyncio>=0\.23\.0",\n', '\n', content)
content = re.sub(r'\s*"pytest-cov>=5\.0\.0",\n', '\n', content)

# Add them back correctly to optional dev dependencies
content = content.replace(
    '"pip-audit>=2.7.0",',
    '"pip-audit>=2.7.0",\n    "pytest>=9.0.2",\n    "pytest-asyncio>=1.3.0",\n    "pytest-cov>=7.0.0",'
)

with open(filepath, "w") as f:
    f.write(content)
