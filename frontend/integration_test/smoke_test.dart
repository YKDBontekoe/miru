import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:miru/main.dart';
import 'package:miru/core/api/backend_service.dart';
import 'package:miru/core/services/supabase_service.dart';

// Create a mock BackendService for tests
void _setupMockBackend() {
  BackendService.baseUrl.value = 'http://127.0.0.1:8000/api';
  BackendService.bypassWaitForBackend = true;
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Smoke tests', () {
    testWidgets('App launches and renders the auth page', (tester) async {
      await BackendService.init();
      _setupMockBackend();
      await SupabaseService.initialize();
      await tester.pumpWidget(const ProviderScope(child: MiruApp()));

      await tester.pumpAndSettle();

      // Auth page title is visible
      expect(find.text('Miru'), findsWidgets);
    });

    testWidgets('Email input bar is present', (tester) async {
      await BackendService.init();
      _setupMockBackend();
      await SupabaseService.initialize();

      await tester.pumpWidget(const ProviderScope(child: MiruApp()));

      await tester.pumpAndSettle();

      // The text field for email
      expect(find.byType(TextField), findsAtLeastNWidgets(1));
    });

    testWidgets('Typing an email shows it in the input field', (tester) async {
      await BackendService.init();
      _setupMockBackend();
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
