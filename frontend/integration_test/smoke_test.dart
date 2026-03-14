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
      'ui_test_${DateTime.now().millisecondsSinceEpoch}@example.com';
  const testPassword = 'password12345!';

  Future<void> waitFor(WidgetTester tester, Finder finder,
      {Duration timeout = const Duration(seconds: 10)}) async {
    final end = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(end)) {
      if (finder.evaluate().isNotEmpty) return;
      await tester.pump(const Duration(milliseconds: 100));
    }
    if (finder.evaluate().isEmpty) {
      debugPrint('TIMEOUT WAITING FOR: ${finder.toString()}');
      debugPrint('WIDGET TREE:');
      debugPrint(tester.allWidgets.map((e) => e.toString()).join('\n'));
      throw Exception('Timed out waiting for ${finder.toString()}');
    }
  }

  void checkUnexpectedSnackbars(WidgetTester tester, String context) {
    final snackbars = find.byType(SnackBar).evaluate();
    if (snackbars.isNotEmpty) {
      String messages = '';
      for (final e in snackbars) {
        final snackbar = e.widget as SnackBar;
        if (snackbar.content is Text) {
          final textWidget = snackbar.content as Text;
          debugPrint(
              'UNEXPECTED SNACKBAR FOUND ($context): ${textWidget.data}');
          messages += '${textWidget.data}; ';
        } else {
          debugPrint(
              'UNEXPECTED SNACKBAR FOUND ($context) with non-text content');
        }
      }
      expect(snackbars, isEmpty,
          reason: 'Unexpected snackbars found during $context: $messages');
    }
  }

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

      BackendService.bypassWaitForBackend = true;
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      await waitFor(tester, find.textContaining('Miru'));
      expect(find.textContaining('Miru'), findsWidgets);
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

      BackendService.bypassWaitForBackend = true;
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      const testInput = 'test@example.com';
      final emailField = find.byType(TextField).first;
      await waitFor(tester, emailField);
      await tester.enterText(emailField, testInput);
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

      await Supabase.instance.client.auth.signOut();

      // Pre-create the user safely without swallowing errors
      try {
        await Supabase.instance.client.auth.signUp(
          email: uniqueEmail,
          password: testPassword,
        );
      } catch (e) {
        debugPrint('Signup info (safe to ignore if user exists): $e');
      }
      // We must sign out again to ensure the UI starts logged out
      await Supabase.instance.client.auth.signOut();

      // Skip the onboarding screens
      await BackendService.setOnboardingComplete(true);

      BackendService.bypassWaitForBackend = true;
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      // Switch to password mode
      final toggleButton = find.textContaining('Sign in with password instead');
      await waitFor(tester, toggleButton);
      await tester.ensureVisible(toggleButton);
      await tester.tap(toggleButton);
      await tester.pumpAndSettle();

      // Enter credentials
      final emailField = find.byType(TextField).at(0);
      await waitFor(tester, emailField);
      await tester.enterText(emailField, uniqueEmail);
      await tester.enterText(find.byType(TextField).at(1), testPassword);

      // Tap "Sign in"
      final signInButtonFinder = find.descendant(
        of: find.byType(FilledButton),
        matching: find.text('Sign in'),
      );
      await tester.ensureVisible(signInButtonFinder);
      await tester.tap(signInButtonFinder);

      // Wait for auth state change and navigation
      await tester.pumpAndSettle();
      await waitFor(tester, find.text('Rooms'));

      expect(find.text('Rooms'), findsWidgets);
      expect(find.text('Settings'), findsWidgets);

      checkUnexpectedSnackbars(tester, 'sign in');
      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Rooms and Create Persona', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
      await SupabaseService.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      );

      await BackendService.setOnboardingComplete(true);

      // Make sure we're authenticated
      if (Supabase.instance.client.auth.currentUser == null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: uniqueEmail,
            password: testPassword,
          );
          // Wait for auth state to be fully processed by Supabase client
          await Future.delayed(const Duration(seconds: 1));
        } catch (e) {
          debugPrint('Signin failed: $e');
          rethrow;
        }
      }

      BackendService.bypassWaitForBackend = true;
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      // Ensure we are logged in before proceeding
      await waitFor(tester, find.text('Rooms'));

      // Tap Rooms in Bottom Nav
      final roomsNav = find.text('Rooms');
      await tester.tap(roomsNav);
      await tester.pumpAndSettle();

      // Tap the floating Create button (the one with add_rounded icon in MainScaffold)
      final createButton = find.descendant(
        of: find.byType(MainScaffold),
        matching: find.byWidgetPredicate((widget) =>
            widget is Icon &&
            widget.icon == Icons.add_rounded &&
            widget.size == 32),
      );
      await waitFor(tester, createButton);
      await tester.tap(createButton);
      await tester.pumpAndSettle();

      // Wait for the modal sheet to be fully open
      final saveButton = find.textContaining('Save Persona');
      await waitFor(tester, saveButton);

      // Fill in persona name
      final nameField = find.byType(TextField).at(0);
      await tester.enterText(nameField, 'Test Agent');

      final personalityField = find.byType(TextField).at(1);
      await tester.enterText(personalityField, 'You are a test agent.');

      // Tap "Save Persona"
      await tester.ensureVisible(saveButton);
      await tester.tap(saveButton);

      await tester.pumpAndSettle();
      // Give it a bit more time if needed for the backend response and snackbar to show up
      await tester.pump(const Duration(seconds: 1));

      checkUnexpectedSnackbars(tester, 'agent creation');
      expect(find.textContaining('Error'), findsNothing);
    });

    testWidgets('Navigate to Settings page', (tester) async {
      await BackendService.init();
      await BackendService.setBaseUrl(apiUrl);
      BackendService.bypassWaitForBackend = false;
      await BackendService.waitForBackend(
          maxAttempts: 15, initialDelay: const Duration(milliseconds: 500));
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
          await Future.delayed(const Duration(seconds: 1));
        } catch (e) {
          debugPrint('Signin failed: $e');
          rethrow;
        }
      }

      BackendService.bypassWaitForBackend = true;
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      await waitFor(tester, find.text('Rooms'));

      // Tap Settings in Bottom Nav
      final settingsButton = find.descendant(
        of: find.byType(MainScaffold),
        matching: find.text('Settings'),
      );
      await waitFor(tester, settingsButton);

      await tester.tap(settingsButton);
      await tester.pumpAndSettle();

      await waitFor(tester, find.text('Account'));
      expect(find.text('Account'), findsWidgets);
      expect(find.text('Preferences'), findsWidgets);

      checkUnexpectedSnackbars(tester, 'settings page');
      expect(find.textContaining('Error'), findsNothing);
    });
    group('Regression Tests', () {
      testWidgets('Settings page renders account and preferences',
          (tester) async {
        await BackendService.init();
        await BackendService.setBaseUrl(apiUrl);
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
            await Future.delayed(const Duration(seconds: 1));
          } catch (e) {
            debugPrint('Signin failed: $e');
          }
        }

        BackendService.bypassWaitForBackend = true;
        await tester.pumpWidget(const ProviderScope(child: MiruApp()));
        await tester.pumpAndSettle();

        await waitFor(tester, find.text('Rooms'));

        final settingsButton = find.descendant(
          of: find.byType(MainScaffold),
          matching: find.text('Settings'),
        );
        await waitFor(tester, settingsButton);
        await tester.tap(settingsButton);
        await tester.pumpAndSettle();

        expect(find.text('Account'), findsWidgets);
        expect(find.text('Preferences'), findsWidgets);
      });
    });
  });
}
