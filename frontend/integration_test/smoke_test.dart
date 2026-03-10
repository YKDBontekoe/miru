import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:miru/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Smoke tests', () {
    testWidgets('App launches and renders the chat page', (tester) async {
      await tester.pumpWidget(const MiruApp());
      await tester.pumpAndSettle();

      // App bar title is visible
      expect(find.text('Miru'), findsWidgets);
    });

    testWidgets('Empty state is shown when there are no messages',
        (tester) async {
      await tester.pumpWidget(const MiruApp());
      await tester.pumpAndSettle();

      // Empty state copy
      expect(find.text("Hi, I'm Miru."), findsOneWidget);
    });

    testWidgets('Chat input bar is present', (tester) async {
      await tester.pumpWidget(const MiruApp());
      await tester.pumpAndSettle();

      // The text field for composing a message should exist
      expect(find.byType(TextField), findsAtLeastNWidgets(1));
    });

    testWidgets('Typing a message shows it in the input field', (tester) async {
      await tester.pumpWidget(const MiruApp());
      await tester.pumpAndSettle();

      const testInput = 'Hello, Miru!';
      await tester.enterText(find.byType(TextField).first, testInput);
      await tester.pump();

      expect(find.text(testInput), findsOneWidget);
    });
  });
}
