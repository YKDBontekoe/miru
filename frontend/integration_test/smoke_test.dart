import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:miru/main.dart';
import 'package:miru/core/api/backend_service.dart';
import 'package:miru/core/services/supabase_service.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Generate a unique email per run to avoid state collision in Supabase
  final uniqueEmail =
      'ui_test_${DateTime.now().millisecondsSinceEpoch}@example.com';
  const testPassword = 'password12345!';

  group('End-to-End Smoke Tests', () {
    testWidgets(
        'App launches, connects to real backend, and renders the auth page',
        (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize();

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      expect(find.text('Miru'), findsWidgets);
      expect(find.byType(TextField), findsAtLeastNWidgets(1));
    });

    testWidgets('Typing an email shows it in the input field', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize();

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      const testInput = 'test@example.com';
      await tester.enterText(find.byType(TextField).first, testInput);
      await tester.pump();

      expect(find.text(testInput), findsOneWidget);
    });

    testWidgets('Can sign in via password UI and skip onboarding',
        (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
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
      final createButton = find.byWidgetPredicate((widget) =>
          widget is Icon &&
          widget.icon == Icons.add_rounded &&
          widget.size == 32);
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
      final settingsButton = find.byWidgetPredicate(
          (widget) => widget is Icon && widget.icon == Icons.settings_outlined);
      await tester.tap(settingsButton);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      expect(find.text('Settings'), findsWidgets);

      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });
  });
}
