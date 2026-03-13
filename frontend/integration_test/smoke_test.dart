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

  group('End-to-End Smoke Tests', () {
    testWidgets(
        'App launches, connects to real backend, and renders the auth page',
        (tester) async {
      // 1. Initialize services pointing to the local ephemeral CI backend/Supabase
      await BackendService.init();

      // Force the base URL to hit the local ephemeral CI backend instead of production Azure
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');

      // Ensure we hit the real local backend instead of bypassing
      BackendService.bypassWaitForBackend = false;

      // Attempt to wait for the local backend to be healthy
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));

      await SupabaseService.initialize();

      // 2. Pump the widget tree
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));

      await tester.pumpAndSettle();

      // 3. Auth page title is visible
      expect(find.text('Miru'), findsWidgets);

      // 4. Verify the email input bar is present
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

    testWidgets('Can sign up a test user and skip onboarding', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl('http://127.0.0.1:8000/api/v1');
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize();

      // Sign up the user directly via Supabase Auth API
      try {
        await Supabase.instance.client.auth.signUp(
          email: 'integration_test@example.com',
          password: 'password12345!',
        );
      } catch (_) {
        // If user already exists (from a previous test run in the same ephemeral DB), just sign in.
        await Supabase.instance.client.auth.signInWithPassword(
          email: 'integration_test@example.com',
          password: 'password12345!',
        );
      }

      // Skip the onboarding screens so we land directly on MainScaffold
      await BackendService.setOnboardingComplete(true);

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      // Wait for auth stream and animations
      await tester.pumpAndSettle(const Duration(seconds: 2));

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
    });
  });
}
