with open('frontend/integration_test/smoke_test.dart', 'r') as f:
    content = f.read()

# Replace silent catch blocks with logging and throwing
old_signup = """      // Pre-create the user safely
      try {
        await Supabase.instance.client.auth.signUp(
          email: uniqueEmail,
          password: testPassword,
        );
      } catch (_) {}"""

new_signup = """      // Pre-create the user safely without swallowing errors
      try {
        await Supabase.instance.client.auth.signUp(
          email: uniqueEmail,
          password: testPassword,
        );
      } catch (e) {
        debugPrint('Signup failed: $e');
        rethrow;
      }"""

content = content.replace(old_signup, new_signup)

old_signin1 = """      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (_) {}
      }"""

new_signin1 = """      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (e) {
          debugPrint('Signin failed: $e');
          rethrow;
        }
      }"""

content = content.replace(old_signin1, new_signin1)

old_signin2 = """      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (_) {}
      }"""

new_signin2 = """      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (e) {
          debugPrint('Signin failed: $e');
          rethrow;
        }
      }"""

content = content.replace(old_signin2, new_signin2)

with open('frontend/integration_test/smoke_test.dart', 'w') as f:
    f.write(content)
