with open('.github/dependabot.yml', 'r') as f:
    content = f.read()

# Replace the pub/flutter block entirely
import re
new_content = re.sub(
    r'  - package-ecosystem: "pub".*?    update-types: \["version-update:semver-major"\]\n',
    r'''  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "npm"
      - "jules-fix-pending"
    commit-message:
      prefix: "npm"
      include: "scope"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
''',
    content,
    flags=re.DOTALL
)

# Clean up the duplicate npm block from before
new_content = new_content.replace('''  # React Native dependencies\n  - package-ecosystem: "npm"\n    directory: "/frontend"\n    schedule:\n      interval: "weekly"\n''', '')

with open('.github/dependabot.yml', 'w') as f:
    f.write(new_content)
