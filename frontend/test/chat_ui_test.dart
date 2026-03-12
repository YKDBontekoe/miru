import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/chat/pages/chat_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('ChatPage renders with glassmorphism UI elements',
      (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: const ChatPage(),
    ));

    // Allow time for animations or initial frames
    await tester.pumpAndSettle();

    // Verify ChatInputBar is present
    expect(find.byType(ChatInputBar), findsOneWidget);

    // Verify empty state is present initially
    expect(find.byType(AppEmptyState), findsOneWidget);

    // Type some text
    await tester.enterText(find.byType(TextField), 'Hello Miru!');
    await tester.pump();

    // Can't easily test sending message since it hits ApiService right now,
    // but we can check if the UI elements render without crashing.
  });

  testWidgets('ChatBubble renders user and assistant messages',
      (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.light,
      home: Scaffold(
        body: Column(
          children: [
            ChatBubble(text: 'User message', isUser: true),
            ChatBubble(text: 'Assistant message', isUser: false, agentName: 'Miru'),
          ],
        ),
      ),
    ));

    await tester.pumpAndSettle();

    expect(find.text('User message'), findsOneWidget);
    expect(find.text('Assistant message'), findsOneWidget);
    expect(find.text('M'), findsOneWidget); // Avatar initial
  });
}
