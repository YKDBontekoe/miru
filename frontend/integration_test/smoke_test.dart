import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:miru/main.dart';
import 'package:miru/core/api/backend_service.dart';
import 'package:miru/core/services/supabase_service.dart';
import 'package:miru/features/chat/pages/main_scaffold.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Prefer environment variables (passed via --dart-define)
  const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://duxnzcquiukrgjmornxa.supabase.co',
  );
  const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_IfPdFU_wx4imNeBKpMYUOQ_usy_Of1l',
  );
  const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://127.0.0.1:8000/api/v1',
  );

  // Generate a unique email per run to avoid state collision in Supabase
  final uniqueEmail =
      'test_${DateTime.now().millisecondsSinceEpoch}@example.com';
  const testPassword = 'Password123!';

  group('End-to-End Smoke Tests', () {
    testWidgets(
        'App launches, connects to real backend, and renders the auth page',
        (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      expect(find.text('Miru'), findsWidgets);
      expect(find.byType(TextField), findsAtLeastNWidgets(1));
    });

    testWidgets('Typing an email shows it in the input field', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      const testInput = 'test@example.com';
      await tester.enterText(find.byType(TextField).first, testInput);
      await tester.pump();

      expect(find.text(testInput), findsOneWidget);
    });

    testWidgets('Can sign in via password UI and skip onboarding',
        (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );

      // 1. Ensure the user exists in this Supabase instance
      try {
        await Supabase.instance.client.auth.signUp(
          email: uniqueEmail,
          password: testPassword,
        );
      } catch (e) {
        // If they already exist or we hit a limit, we just continue and try to sign in
        debugPrint('Signup info (safe to ignore): $e');
      }

      // 2. Ensure we start logged out for the UI test
      await Supabase.instance.client.auth.signOut();

      // 3. Skip onboarding manually in prefs so we go straight to MainScaffold after login
      await BackendService.setOnboardingComplete(true);

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Switch to password mode
      final toggleButton = find.text('Sign in with password instead');
      await tester.ensureVisible(toggleButton);
      await tester.tap(toggleButton);
      await tester.pumpAndSettle();

      // Enter credentials
      await tester.enterText(find.byType(TextField).at(0), uniqueEmail);
      await tester.enterText(find.byType(TextField).at(1), testPassword);

      // Tap "Sign in"
      final signInButton = find.text('Sign in');
      await tester.ensureVisible(signInButton);
      await tester.tap(signInButton);

      // Wait for auth state change and navigation
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should now be on MainScaffold
      expect(find.text('Rooms'), findsWidgets);
      expect(find.text('Settings'), findsWidgets);

      final snackbars = find.byType(SnackBar).evaluate();
      if (snackbars.isNotEmpty) {
        String messages = '';
        for (final e in snackbars) {
          final snackbar = e.widget as SnackBar;
          if (snackbar.content is Text) {
            final textWidget = snackbar.content as Text;
            debugPrint('UNEXPECTED SNACKBAR FOUND: ${textWidget.data}');
            messages += '${textWidget.data}; ';
          }
        }
        expect(snackbars, isEmpty,
            reason: 'Unexpected snackbars found during sign in: $messages');
      }

      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Rooms and Create Persona', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );

      await BackendService.setOnboardingComplete(true);

      // Ensure authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (e) {
          debugPrint('Auth setup failed: $e');
        }
      }

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap Rooms in Bottom Nav
      await tester.tap(find.text('Rooms'));
      await tester.pumpAndSettle();

      // Tap the floating Create button (the one with add_rounded icon in MainScaffold)
      // Find the create button by widget predicate to uniquely identify the center FAB (it's the only size: 32 icon in MainScaffold)
      final createButton = find.descendant(
        of: find.byType(MainScaffold),
        matching: find.byWidgetPredicate((widget) =>
            widget is Icon &&
            widget.icon == Icons.add_rounded &&
            widget.size == 32),
      );
      expect(createButton, findsOneWidget, reason: 'FAB not found');
      await tester.tap(createButton);
      await tester.pumpAndSettle();

      // Fill in persona name
      final nameField = find.byType(TextField).at(0);
      await tester.enterText(nameField, 'Test Agent');

      final personalityField = find.byType(TextField).at(1);
      await tester.enterText(personalityField, 'You are a helpful test agent.');

      // Tap "Save Persona"
      final saveButton = find.text('Save Persona');
      expect(saveButton, findsOneWidget,
          reason: 'saveButton not found. Widget tree will be dumped.');
      await tester.ensureVisible(saveButton);
      await tester.tap(saveButton);

      await tester.pumpAndSettle(const Duration(seconds: 2));

      final snackbars = find.byType(SnackBar).evaluate();
      if (snackbars.isNotEmpty) {
        String messages = '';
        for (final e in snackbars) {
          final snackbar = e.widget as SnackBar;
          if (snackbar.content is Text) {
            final textWidget = snackbar.content as Text;
            debugPrint('UNEXPECTED SNACKBAR FOUND: ${textWidget.data}');
            messages += '${textWidget.data}; ';
          }
        }
        expect(snackbars, isEmpty,
            reason:
                'Unexpected snackbars found during agent creation: $messages');
      }

      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Settings page', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );

      await BackendService.setOnboardingComplete(true);

      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
        } catch (e) {
          debugPrint('Auth setup failed: $e');
        }
      }

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Tap Settings in Bottom Nav
      // Find the Icon with Icons.settings_outlined or matching text safely in the Bottom Nav.
      final settingsButton = find.descendant(
        of: find.byType(MainScaffold),
        matching: find.text('Settings'),
      );
      expect(settingsButton, findsOneWidget,
          reason: 'settings nav item not found');

      await tester.tap(settingsButton);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      expect(find.text('Account'), findsWidgets);
      expect(find.text('Preferences'), findsWidgets);

      final snackbars = find.byType(SnackBar).evaluate();
      if (snackbars.isNotEmpty) {
        String messages = '';
        for (final e in snackbars) {
          final snackbar = e.widget as SnackBar;
          if (snackbar.content is Text) {
            final textWidget = snackbar.content as Text;
            debugPrint('UNEXPECTED SNACKBAR FOUND: ${textWidget.data}');
            messages += '${textWidget.data}; ';
          }
        }
        expect(snackbars, isEmpty,
            reason: 'Unexpected snackbars found on settings page: $messages');
      }

      expect(find.textContaining('Error'), findsNothing);
    });
  });
}
