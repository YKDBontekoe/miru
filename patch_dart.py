import re

with open('frontend/integration_test/smoke_test.dart', 'r') as f:
    content = f.read()

# Make sure we're not accidentally bypassing UI in the remaining tests since they share state in a real integration test environment.
# Instead of doing direct headless signIn, we will just use the pre-created UI test user from Test 3.
old_test4_auth = """      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: 'integration_test@example.com',
            password: 'password12345!',
          );
        } catch (_) {}
      }"""

new_test4_auth = """      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: 'ui_test@example.com',
            password: 'password12345!',
          );
        } catch (_) {}
      }"""

content = content.replace(old_test4_auth, new_test4_auth)

with open('frontend/integration_test/smoke_test.dart', 'w') as f:
    f.write(content)
