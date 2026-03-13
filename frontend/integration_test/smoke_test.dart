import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
      BackendService.bypassWaitForBackend = false;
      await SupabaseService.initialize();

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));
      await tester.pumpAndSettle();

      const testInput = 'test@example.com';
      await tester.enterText(find.byType(TextField).first, testInput);
      await tester.pump();

      expect(find.text(testInput), findsOneWidget);
    });
  });
}
