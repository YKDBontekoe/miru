import re

with open('.github/workflows/flutter-web-smoke-test.yml', 'r') as f:
    content = f.read()

# Fix the flutter build string to properly preserve line breaks
bad_build = "flutter build web --release             --dart-define=API_URL=http://127.0.0.1:8000/api/v1             --dart-define=SUPABASE_URL=http://127.0.0.1:54321             --dart-define=SUPABASE_ANON_KEY=${{ steps.supabase-keys.outputs.ANON_KEY }}"
good_build = "flutter build web --release \\\n            --dart-define=API_URL=http://127.0.0.1:8000/api/v1 \\\n            --dart-define=SUPABASE_URL=http://127.0.0.1:54321 \\\n            --dart-define=SUPABASE_ANON_KEY=${{ steps.supabase-keys.outputs.ANON_KEY }}"

content = content.replace(bad_build, good_build)

with open('.github/workflows/flutter-web-smoke-test.yml', 'w') as f:
    f.write(content)
