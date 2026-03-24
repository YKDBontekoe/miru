import re

with open('AGENTS.md', 'r') as f:
    content = f.read()

agent_section = """## Agent Roster & Responsibilities

The following AI agents actively monitor and modify the Miru codebase. Their actions are automated via `.github/workflows/ai-agents.yml`.

### 1. Jules
**Mission:** Autonomous bug fixing, CodeRabbit review resolution, and Sentry issue remediation.
**Trigger Conditions:**
- Mentioned by the CodeRabbit Bridge in a PR comment (loop limit: 3 rounds).
- Scheduled every 6 hours to pull open issues labeled `jules-fix-pending`.
- Manual workflow dispatch on an issue labeled `jules-fix-pending`.
**Scope:** Authorized to modify backend Python files, frontend React Native (TypeScript) files, and tests. Not authorized to restructure databases without human approval.
**Note on Prompt:** Jules is instructed to strictly follow project architecture (Domain logic in `backend/app/domain/`, routes in `backend/app/api/v1/`, frontend in `frontend/`) and test requirements (never mock the database or Redis, mock external services).

### 2. CodeRabbit
**Mission:** Continuous code review, enforcing style, finding bugs, and suggesting refactors.
**Trigger Conditions:**
- Automatically invoked when the "PR Checks and Linting" CI workflow completes successfully on a PR branch.
- Retries automatically every 30 minutes if rate-limited (label `coderabbit:queued`).
**Scope:** Reviews all modified files in a PR. Posts actionable comments. When 0 actionable comments are found, it triggers the `ai-approved` label.

"""

# Insert agent_section before ## Project Structure
content = re.sub(r'(## Project Structure)', agent_section + r'\1', content)

with open('AGENTS.md', 'w') as f:
    f.write(content)
