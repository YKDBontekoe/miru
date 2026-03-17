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

    // Find the Container used for the dots
    final containerFinder = find
        .descendant(
          of: find.byType(TypingIndicator),
          matching: find.byType(Container),
        )
        .first;

    expect(containerFinder, findsOneWidget);

    // Evaluate color mapping based on Alice's hashcode.
    final Container container = tester.widget(containerFinder);
    final BoxDecoration decoration = container.decoration as BoxDecoration;
    final Color actualColor = decoration.color!;

    // We get the actual theme to compare
    final BuildContext context = tester.element(find.byType(TypingIndicator));
    final colors = context.colors;
    final baseColors = [
      colors.primary,
      colors.info,
      colors.error,
      colors.primarySurface,
      colors.primaryLight,
      colors.warning,
    ];

    expect(baseColors.contains(actualColor), isTrue);
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

    final containerFinder = find
        .descendant(
          of: find.byType(TypingIndicator),
          matching: find.byType(Container),
        )
        .first;

    final Container container = tester.widget(containerFinder);
    final BoxDecoration decoration = container.decoration as BoxDecoration;
    final Color actualColor = decoration.color!;

    final BuildContext context = tester.element(find.byType(TypingIndicator));
    final expectedColor = context.colors.onSurfaceMuted;
    expect(actualColor, expectedColor);
  });
}
