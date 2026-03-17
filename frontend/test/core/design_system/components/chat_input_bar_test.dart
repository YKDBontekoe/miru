import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/design_system/components/chat_input_bar.dart';

void main() {
  testWidgets('ChatInputBar renders correctly in light and dark mode', (WidgetTester tester) async {
    final controller = TextEditingController();
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.light,
        home: Scaffold(
          body: ChatInputBar(
            controller: controller,
            onSend: () {},
            isStreaming: false,
          ),
        ),
      ),
    );

    expect(find.byType(ChatInputBar), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: Scaffold(
          body: ChatInputBar(
            controller: controller,
            onSend: () {},
            isStreaming: false,
          ),
        ),
      ),
    );

    expect(find.byType(ChatInputBar), findsOneWidget);
  });
}
