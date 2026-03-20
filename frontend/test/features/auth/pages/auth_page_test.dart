import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/services/supabase_service.dart';
import 'package:miru/features/auth/pages/auth_page.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: AppTheme.light, darkTheme: AppTheme.dark, home: child);

/// Pumps one frame plus a short animation tick without risking a timeout from
/// repeating animations (e.g. the fade-in AnimationController in AuthPage).
Future<void> _settle(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
}

void main() {
  // Inject a never-emitting stream so AuthPage.initState never touches the
  // real Supabase.instance. Also mark the user as not authenticated.
  setUp(() {
    SupabaseService.authStateChangesOverride =
        StreamController<AuthState>.broadcast().stream;
    SupabaseService.isAuthenticatedOverride = false;
  });

  tearDown(() {
    SupabaseService.authStateChangesOverride = null;
    SupabaseService.isAuthenticatedOverride = null;
  });

  // -------------------------------------------------------------------------
  // Initial render
  // -------------------------------------------------------------------------

  group('AuthPage – initial render', () {
    testWidgets('shows app name, email field, and primary CTA', (tester) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      expect(find.text('Miru'), findsWidgets);
      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Send magic link'), findsOneWidget);
      expect(find.text('Sign in with passkey'), findsOneWidget);
    });

    testWidgets('subtitle reflects magic-link mode on first render', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      expect(
        find.text('Sign in with a magic link or your passkey.'),
        findsOneWidget,
      );
    });

    testWidgets('password field is hidden on first render', (tester) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      // Only the email field is visible before the toggle is tapped.
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('privacy note is visible', (tester) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      expect(find.textContaining('Magic links expire after'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // Form validation
  // -------------------------------------------------------------------------

  group('AuthPage – form validation', () {
    testWidgets('shows required-email error when submitted with empty field', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      await tester.tap(find.text('Send magic link'));
      await _settle(tester);

      expect(find.text('Please enter your email'), findsOneWidget);
    });

    testWidgets('shows invalid-email error for malformed address', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      await tester.enterText(find.byType(TextFormField).first, 'not-an-email');
      await tester.tap(find.text('Send magic link'));
      await _settle(tester);

      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('no validation error for a well-formed email', (tester) async {
      // With valid email the form passes validation and tries to call the auth
      // service. Since Supabase is not initialised the call throws an
      // unhandled exception that AuthPage catches and shows as a generic error.
      // What matters: no *validation* error is shown.
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      await tester.enterText(
        find.byType(TextFormField).first,
        'user@example.com',
      );
      await tester.tap(find.text('Send magic link'));
      await _settle(tester);

      expect(find.text('Please enter your email'), findsNothing);
      expect(find.text('Please enter a valid email'), findsNothing);
    });
  });

  // -------------------------------------------------------------------------
  // Password toggle
  // -------------------------------------------------------------------------

  group('AuthPage – password toggle', () {
    testWidgets(
      'tapping "Sign in with password instead" reveals password field',
      (tester) async {
        await tester.pumpWidget(_wrap(const AuthPage()));
        await _settle(tester);

        await tester.tap(find.text('Sign in with password instead'));
        await _settle(tester);

        // Two fields now: email + password.
        expect(find.byType(TextFormField), findsNWidgets(2));
        expect(find.text('Sign in'), findsOneWidget);
      },
    );

    testWidgets('subtitle updates to password mode after toggle', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      await tester.tap(find.text('Sign in with password instead'));
      await _settle(tester);

      expect(
        find.text('Sign in with your email and password.'),
        findsOneWidget,
      );
    });

    testWidgets('tapping "Use magic link instead" hides password field again', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      await tester.tap(find.text('Sign in with password instead'));
      await _settle(tester);
      await tester.tap(find.text('Use magic link instead'));
      await _settle(tester);

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Send magic link'), findsOneWidget);
    });

    testWidgets(
      'shows password-required error when Sign in tapped with empty password',
      (tester) async {
        await tester.pumpWidget(_wrap(const AuthPage()));
        await _settle(tester);

        await tester.tap(find.text('Sign in with password instead'));
        await _settle(tester);

        await tester.enterText(
          find.byType(TextFormField).first,
          'user@example.com',
        );
        await tester.tap(find.text('Sign in'));
        await _settle(tester);

        expect(find.text('Please enter your password'), findsOneWidget);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Text input
  // -------------------------------------------------------------------------

  group('AuthPage – text input', () {
    testWidgets('typed email is reflected in the field', (tester) async {
      await tester.pumpWidget(_wrap(const AuthPage()));
      await _settle(tester);

      const email = 'alice@example.com';
      await tester.enterText(find.byType(TextFormField).first, email);
      await tester.pump();

      expect(find.text(email), findsOneWidget);
    });
  });
}
