import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';

void main() {
  testWidgets('ChatInputBar renders correctly in light and dark mode', (
    WidgetTester tester,
  ) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);

    bool sendInvoked = false;
    bool stopInvoked = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.light,
        home: Scaffold(
          body: ChatInputBar(
            controller: controller,
            onSend: () {
              sendInvoked = true;
              controller.clear();
            },
            isStreaming: false,
            onStopStreaming: () {
              stopInvoked = true;
            },
          ),
        ),
      ),
    );

    expect(find.byType(ChatInputBar), findsOneWidget);

    // Simulate typing and sending
    await tester.enterText(find.byType(TextField), 'Hello Miru');
    await tester.pumpAndSettle();

    // Tap the send button directly via Icon
    final sendButton = find.byIcon(Icons.arrow_upward_rounded);
    await tester.tap(sendButton);
    await tester.pumpAndSettle();

    expect(sendInvoked, isTrue);
    expect(controller.text, isEmpty);

    // Verify dark mode mounts with streaming=true
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: Scaffold(
          body: ChatInputBar(
            controller: controller,
            onSend: () {},
            isStreaming: true,
            onStopStreaming: () {
              stopInvoked = true;
            },
          ),
        ),
      ),
    );

    expect(find.byType(ChatInputBar), findsOneWidget);

    // Simulate stopping stream
    final stopButton = find.descendant(
      of: find.byType(ChatInputBar),
      matching: find.byIcon(Icons.stop_rounded),
    );
    if (stopButton.evaluate().isNotEmpty) {
      await tester.tap(stopButton.first);
      await tester.pumpAndSettle();
      expect(stopInvoked, isTrue);
    }
  });
}
