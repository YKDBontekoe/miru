import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/design_system/design_system.dart';

void main() {
  testWidgets('Miru design system renders correctly', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: Center(child: Text('Miru'))),
      ),
    );
    expect(find.textContaining('Miru'), findsWidgets);
  });
}
