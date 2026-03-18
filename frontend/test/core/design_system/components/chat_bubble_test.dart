import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/components/chat_bubble.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/models/message_status.dart';

void main() {
  Widget buildTestWidget({required Widget child}) {
    return MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: Scaffold(body: child),
    );
  }

  testWidgets('ChatBubble renders user message correctly', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const ChatBubble(
          text: 'Hello, this is a user message',
          isUser: true,
        ),
      ),
    );

    expect(find.text('Hello, this is a user message'), findsOneWidget);
  });

  testWidgets('ChatBubble renders agent message correctly', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const ChatBubble(
          text: 'Hello, this is an agent message',
          isUser: false,
          agentName: 'TestAgent',
          status: MessageStatus.sent,
        ),
      ),
    );

    expect(find.text('Hello, this is an agent message'), findsOneWidget);
    expect(find.text('TestAgent'), findsOneWidget);
  });

  testWidgets('ChatBubble renders failed message and action chips', (tester) async {
    bool retryPressed = false;
    await tester.pumpWidget(
      buildTestWidget(
        child: ChatBubble(
          text: 'Failed message',
          isUser: false,
          status: MessageStatus.failed,
          onRetry: () => retryPressed = true,
          onCopy: () {},
        ),
      ),
    );

    expect(find.text('Failed message'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(find.text('Copy'), findsOneWidget);

    await tester.tap(find.text('Retry'));
    expect(retryPressed, isTrue);
  });
}
