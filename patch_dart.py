import re

with open('frontend/integration_test/smoke_test.dart', 'r') as f:
    content = f.read()

# Replace test 3, 4, 5
old_code = """    testWidgets('Can sign in via password UI and skip onboarding', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize();

      // We must sign out first in case previous test left us signed in locally
      await Supabase.instance.client.auth.signOut();

      // Pre-create the user directly via Supabase Auth API (headless) so they exist in DB
      try {
        await Supabase.instance.client.auth.signUp(
          email: 'ui_test@example.com',
          password: 'password12345!',
        );
        await Supabase.instance.client.auth.signOut();
      } catch (_) {}

      // Skip the onboarding screens so we land directly on MainScaffold after login
      await BackendService.setOnboardingComplete(true);

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap "Sign in with password instead"
      final toggleButton = find.text('Sign in with password instead');
      await tester.ensureVisible(toggleButton);
      await tester.tap(toggleButton);
      await tester.pumpAndSettle();

      // Enter email
      await tester.enterText(find.byType(TextField).at(0), 'ui_test@example.com');

      // Enter password
      await tester.enterText(find.byType(TextField).at(1), 'password12345!');

      // Tap "Sign In"
      final signInButton = find.text('Sign In');
      await tester.ensureVisible(signInButton);
      await tester.tap(signInButton);

      // Wait for network request and auth state stream to emit
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // We should now be in the MainScaffold, which has 'Rooms' and 'Settings' nav items
      expect(find.text('Rooms'), findsWidgets);
      expect(find.text('Settings'), findsWidgets);

      // Assert no error snackbars or texts are displayed after login
      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Rooms and Create Persona', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize();
      await BackendService.setOnboardingComplete(true);

      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: 'ui_test@example.com',
            password: 'password12345!',
          );
        } catch (_) {}
      }

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap on the middle action button (Create button)
      // The nav bar has Rooms, Create Button (Icon), Settings.
      // The Create button has an add_rounded icon.
      await tester.tap(find.byIcon(Icons.add_rounded));
      await tester.pumpAndSettle();

      // Find text fields inside CreatePersonaSheet
      // The name field has label "Name"
      final nameField = find.byType(TextField).at(0);
      await tester.enterText(nameField, 'Test Agent');

      // The personality field has label "Personality / Instructions"
      final personalityField = find.byType(TextField).at(1);
      await tester.enterText(personalityField, 'You are a test agent.');

      // Tap "Save Persona"
      final saveButton = find.text('Save Persona');
      // Scroll to it if needed
      await tester.ensureVisible(saveButton);
      await tester.tap(saveButton);

      // Wait for bottom sheet to close and list to reload
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // We should be back on the Rooms page, but it might just be the chat view.
      // Rooms view should show the created agent in the list.

      // Assert no errors occurred during navigation or saving
      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Settings page', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize();
      await BackendService.setOnboardingComplete(true);

      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: 'integration_test@example.com',
            password: 'password12345!',
          );
        } catch (_) {}
      }

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap the Settings nav item
      await tester.tap(find.text('Settings').last);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      // Verify we are on Settings page (e.g. looking for text "Theme", "App Settings", etc.)
      expect(find.text('Settings'), findsWidgets);

      // Assert no errors occurred during settings navigation
      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });"""

new_code = """    // Generate a unique email per run to avoid state collision in Supabase
    final uniqueEmail = 'ui_test_${DateTime.now().millisecondsSinceEpoch}@example.com';
    const testPassword = 'password12345!';

    testWidgets('Can sign in via password UI and skip onboarding', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize();

      await Supabase.instance.client.auth.signOut();

      // Pre-create the user safely
      try {
        await Supabase.instance.client.auth.signUp(
          email: uniqueEmail,
          password: testPassword,
        );
      } catch (_) {}
      // We must sign out again to ensure the UI starts logged out
      await Supabase.instance.client.auth.signOut();

      // Skip the onboarding screens
      await BackendService.setOnboardingComplete(true);

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap "Sign in with password instead"
      final toggleButton = find.text('Sign in with password instead');
      await tester.ensureVisible(toggleButton);
      await tester.tap(toggleButton);
      await tester.pumpAndSettle();

      // Enter email
      await tester.enterText(find.byType(TextField).at(0), uniqueEmail);

      // Enter password
      await tester.enterText(find.byType(TextField).at(1), testPassword);

      // Tap "Sign In"
      final signInButton = find.text('Sign In');
      await tester.ensureVisible(signInButton);
      await tester.tap(signInButton);

      // Wait for network request and auth state stream to emit
      await tester.pumpAndSettle(const Duration(seconds: 3));

      expect(find.text('Rooms'), findsWidgets);
      expect(find.text('Settings'), findsWidgets);

      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Rooms and Create Persona', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize();
      await BackendService.setOnboardingComplete(true);

      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (_) {}
      }

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Find the create button by widget predicate to uniquely identify the center FAB (it's the only size: 32 icon)
      final createButton = find.byWidgetPredicate((widget) => widget is Icon && widget.icon == Icons.add_rounded && widget.size == 32);
      await tester.tap(createButton);
      await tester.pumpAndSettle();

      // Find text fields inside CreatePersonaSheet
      final nameField = find.byType(TextField).at(0);
      await tester.enterText(nameField, 'Test Agent');

      final personalityField = find.byType(TextField).at(1);
      await tester.enterText(personalityField, 'You are a test agent.');

      // Tap "Save Persona"
      final saveButton = find.text('Save Persona');
      await tester.ensureVisible(saveButton);
      await tester.tap(saveButton);

      await tester.pumpAndSettle(const Duration(seconds: 2));

      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Settings page', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize();
      await BackendService.setOnboardingComplete(true);

      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (_) {}
      }

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap the Settings nav item. Since there could be other 'Settings' texts, we'll find the Icon with Icons.settings_outlined or matching text safely.
      final settingsButton = find.byWidgetPredicate((widget) => widget is Icon && widget.icon == Icons.settings_outlined);
      await tester.tap(settingsButton);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      expect(find.text('Settings'), findsWidgets);

      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });"""

content = content.replace(old_code, new_code)

with open('frontend/integration_test/smoke_test.dart', 'w') as f:
    f.write(content)
