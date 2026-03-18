import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:miru/features/productivity/pages/action_page.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';

void main() {
  testWidgets('ActionPage renders tabs correctly', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(theme: AppTheme.light, home: const ActionPage()),
      ),
    );

    expect(find.byType(ActionPage), findsOneWidget);
    expect(find.text('Calendar'), findsOneWidget);
    expect(find.text('Tasks'), findsOneWidget);
    expect(find.text('Notes'), findsOneWidget);
  });
}
