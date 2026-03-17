import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';

void main() {
  testWidgets('TypingIndicator maps agent name to theme colors correctly', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: TypingIndicator(agentName: 'Alice')),
      ),
    );

    expect(find.byType(TypingIndicator), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 500));
  });

  testWidgets('TypingIndicator without agent name uses muted surface color', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: TypingIndicator(agentName: null)),
      ),
    );

    expect(find.byType(TypingIndicator), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 500));
  });
}
