import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/rooms/pages/rooms_page.dart';

void main() {
  testWidgets('RoomsPage renders empty state successfully', (WidgetTester tester) async {
    // Basic test to render RoomsPage with defaults.
    // It should safely display loading indicators utilizing context.colors.primary.
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(
          body: RoomsPage(),
        ),
      ),
    );

    expect(find.byType(RoomsPage), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsWidgets);
    await tester.pump(const Duration(seconds: 1));
  });
}
