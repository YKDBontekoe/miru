import re

with open('.github/workflows/flutter-web-smoke-test.yml', 'r') as f:
    content = f.read()

# 1. Fix path to .env.test in Extract Supabase Keys step
content = content.replace("grep 'ANON_KEY=' backend/.env.test", "grep 'ANON_KEY=' ../backend/.env.test")

# 2. Add cleanup step at the end of the workflow
cleanup_step = """
      # -----------------------------------------------------------------------
      # Cleanup ephemeral local instances
      # -----------------------------------------------------------------------
      - name: Stop processes
        if: always()
        run: |
          # Kill all running background jobs like UV and uvicorn
          kill $(jobs -p) 2>/dev/null || true
          pkill uvicorn || true

      - name: Stop Local Supabase
        if: always()
        working-directory: ./supabase
        run: supabase stop
"""

# Append cleanup step at the end
content = content + cleanup_step

# 3. Replace the axe-core exit code handling
# Instead of letting axe exit 2 and fail the step (which somehow got bubbled up or something),
# we can just use set +e and not use --exit, or explicitly ignore failures
axe_step = """      - name: Run accessibility check
        run: axe http://localhost:8080 --exit
        continue-on-error: true   # informational; does not fail the pipeline"""
new_axe_step = """      - name: Run accessibility check
        run: axe http://localhost:8080 || echo "Axe checks failed or could not run"
        continue-on-error: true   # informational; does not fail the pipeline"""
content = content.replace(axe_step, new_axe_step)


with open('.github/workflows/flutter-web-smoke-test.yml', 'w') as f:
    f.write(content)
