import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/chat/widgets/streaming_status_pill.dart';

void main() {
  testWidgets('StreamingStatusPill renders correctly', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(body: StreamingStatusPill(label: 'Thinking...')),
      ),
    );
    await tester.pump();
    expect(find.byType(StreamingStatusPill), findsOneWidget);
  });
}
