import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/features/agents/pages/agents_page.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';

void main() {
  testWidgets('AgentsPage renders basic skeleton', (tester) async {
    // Basic rendering check to hit the code execution paths in AgentsPage
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.light, home: const AgentsPage()),
    );

    // We just want to test that the widget builds (which covers UI code)
    expect(find.byType(AgentsPage), findsOneWidget);
  });
}
