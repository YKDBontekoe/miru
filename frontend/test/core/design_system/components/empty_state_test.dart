import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/components/empty_state.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';

void main() {
  Widget buildTestWidget({required Widget child}) {
    return MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: Scaffold(body: child),
    );
  }

  testWidgets('AppEmptyState renders title and subtitle correctly', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(
          title: 'Hello Miru',
          subtitle: 'This is a test subtitle',
          suggestions: ['Ask me anything'],
        ),
      ),
    );

    expect(find.text('Hello Miru'), findsOneWidget);
    expect(find.text('This is a test subtitle'), findsOneWidget);
    expect(find.text('Ask me anything'), findsOneWidget);
    expect(find.byType(Icon), findsWidgets);
  });

  testWidgets('AppEmptyState handles action button', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: AppEmptyState(
          title: 'Hello Miru',
          action: ElevatedButton(
            onPressed: () {},
            child: const Text('Action Button'),
          ),
        ),
      ),
    );

    expect(find.text('Action Button'), findsOneWidget);
  });
}
