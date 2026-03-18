import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/features/rooms/widgets/persona_detail_sheet.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/models/agent.dart';

void main() {
  testWidgets('PersonaDetailSheet renders agent details correctly', (
    tester,
  ) async {
    final agent = Agent(
      id: '1',
      name: 'Test Persona',
      personality: 'Friendly and helpful',
      createdAt: DateTime.now().toIso8601String(),
    );

    bool deleteTriggered = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          body: PersonaDetailSheet(
            agent: agent,
            onDeleted: () => deleteTriggered = true,
          ),
        ),
      ),
    );

    expect(find.text('Test Persona'), findsOneWidget);
    expect(find.text('Friendly and helpful'), findsOneWidget);
    expect(find.text('Delete Persona'), findsOneWidget);

    await tester.tap(find.text('Delete Persona'));
    await tester.pump();

    // Check loading indicator
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();
    expect(deleteTriggered, isTrue);
  });
}
