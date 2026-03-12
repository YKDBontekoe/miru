import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:miru/core/design_system/design_system.dart';

void main() {
  testWidgets('Miru design system renders correctly',
      (WidgetTester tester) async {
    // Basic test to verify the design system doesn't break
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: const Scaffold(
        body: Center(
          child: AppCard(
            child: Text('Test Component'),
          ),
        ),
      ),
    ));

    expect(find.text('Test Component'), findsOneWidget);
    expect(find.byType(AppCard), findsOneWidget);
  });
}
