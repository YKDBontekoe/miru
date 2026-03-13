import re

with open('.github/workflows/flutter-web-smoke-test.yml', 'r') as f:
    content = f.read()

# Replace Node & npm install with the official Supabase setup action
old_setup = """      - name: Setup Node (for Supabase CLI)
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Supabase CLI
        run: npm install -g supabase"""

new_setup = """      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest"""

content = content.replace(old_setup, new_setup)

with open('.github/workflows/flutter-web-smoke-test.yml', 'w') as f:
    f.write(content)
