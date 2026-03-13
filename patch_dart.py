with open('frontend/integration_test/smoke_test.dart', 'r') as f:
    content = f.read()

# Replace first test setup
old_test1 = """      // 1. Initialize services pointing to the local ephemeral CI backend/Supabase
      await BackendService.init();

      // Ensure we hit the real local backend instead of bypassing
      BackendService.bypassWaitForBackend = false;

      // Attempt to wait for the local backend to be healthy
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));"""

new_test1 = """      // 1. Initialize services pointing to the local ephemeral CI backend/Supabase
      await BackendService.init();

      // Force the base URL to hit the local ephemeral CI backend instead of production Azure
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');

      // Ensure we hit the real local backend instead of bypassing
      BackendService.bypassWaitForBackend = false;

      // Attempt to wait for the local backend to be healthy
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));"""

content = content.replace(old_test1, new_test1)

# Replace second test setup
old_test2 = """    testWidgets('Typing an email shows it in the input field', (tester) async {
      await BackendService.init();
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize();"""

new_test2 = """    testWidgets('Typing an email shows it in the input field', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize();"""

content = content.replace(old_test2, new_test2)

with open('frontend/integration_test/smoke_test.dart', 'w') as f:
    f.write(content)
