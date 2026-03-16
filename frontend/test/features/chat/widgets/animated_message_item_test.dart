import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/chat/widgets/animated_message_item.dart';

void main() {
  testWidgets('AnimatedMessageItem renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
          home: Scaffold(
            body: AnimatedMessageItem(
              child: Text('Animated Message'),
            ),
          ),
              ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Animated Message'), findsOneWidget);
  });
}
