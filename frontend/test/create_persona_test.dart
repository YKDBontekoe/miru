import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:miru/features/rooms/widgets/create_persona_sheet.dart';
import 'package:miru/core/design_system/design_system.dart';

import 'package:miru/core/design_system/theme/app_theme_data.dart';

void main() {
  testWidgets(
      'CreatePersonaSheet renders correctly and has Save Persona button',
      (WidgetTester tester) async {
    // Provide a simple theme context since the widget uses it
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(
            body: CreatePersonaSheet(),
          ),
        ),
      ),
    );

    // Initial render
    await tester.pump();

    // Verify Title
    expect(find.text('New Persona'), findsOneWidget);

    // Verify TextFields (Name, Personality, Keyword)
    // The widget has 3 TextFields: Name, Personality, and Keyword
    expect(find.byType(TextField), findsAtLeastNWidgets(3));

    // Verify "Save Persona" button exists
    final saveButton = find.text('Save Persona');
    expect(saveButton, findsOneWidget);

    // Verify "GENERATE WITH AI" section
    expect(find.text('GENERATE WITH AI'), findsOneWidget);
  });
}
