with open(".github/workflows/pr-teardown.yml", "r") as f:
    content = f.read()

new_content = content.replace(
    "      - name: Remove PR Label and Deactivate Revisions",
    "      - name: Upgrade containerapp CLI extension\n"
    "        run: az extension add --name containerapp --upgrade --yes\n\n"
    "      - name: Remove PR Label and Deactivate Revisions"
)

with open(".github/workflows/pr-teardown.yml", "w") as f:
    f.write(new_content)
