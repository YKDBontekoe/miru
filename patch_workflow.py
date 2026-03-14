import re

with open('.github/workflows/flutter-web-smoke-test.yml', 'r') as f:
    content = f.read()

# Replace the block more securely.
old_block = r"""      - name: Run integration smoke tests \(Chrome headless\)
        run: \|
          flutter drive \\
            --driver=test_driver/integration_test_driver.dart \\
            --target=integration_test/smoke_test.dart \\
            -d web-server \\
            --web-port=8081 \\
            --headless \\
            --browser-name=chrome \\
            --dart-define=API_URL=http://127.0.0.1:8000/api/v1 \\
            --dart-define=SUPABASE_URL=http://127.0.0.1:54321 \\
        continue-on-error: false"""

# Let's just do a simpler search and replace that doesn't depend on exact spacing for the whole block
# Notice that my previous commit DID change the file (I see the API_URL and SUPABASE_URL strings),
# but it was missing the trailing ANON_KEY or it got cut off?!
