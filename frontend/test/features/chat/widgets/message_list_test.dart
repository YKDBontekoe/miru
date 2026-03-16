import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:miru/features/chat/widgets/message_list.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/models/message_status.dart';

void main() {
  testWidgets('MessageList renders correctly', (WidgetTester tester) async {
    final List<ChatMessage> messages = [
      ChatMessage(
        id: '1',
        text: 'Hello!',
        userId: 'user-id',
        timestamp: DateTime.now(),
        status: MessageStatus.sent,
      ),
    ];
    final scrollController = ScrollController();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MessageList(
            messages: messages,
            scrollController: scrollController,
            isStreaming: false,
            streamingStatus: null,
            onCopy: (msg) {},
            onRetry: () {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(MessageList), findsOneWidget);
  });
}
