import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/components/chat_input_bar.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';

void main() {
  Widget buildTestWidget({
    required Widget child,
    required Brightness brightness,
  }) {
    return MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: brightness == Brightness.dark
          ? ThemeMode.dark
          : ThemeMode.light,
      home: Scaffold(body: child),
    );
  }

  testWidgets('ChatInputBar renders correctly in light and dark mode', (
    tester,
  ) async {
    final controller = TextEditingController();
    bool sent = false;

    await tester.pumpWidget(
      buildTestWidget(
        brightness: Brightness.light,
        child: ChatInputBar(
          controller: controller,
          onSend: () => sent = true,
          hintText: 'Test hint',
        ),
      ),
    );

    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('Test hint'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'test message');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    expect(sent, isTrue);

    // Dark mode
    await tester.pumpWidget(
      buildTestWidget(
        brightness: Brightness.dark,
        child: ChatInputBar(
          controller: controller,
          onSend: () {},
          hintText: 'Test hint',
        ),
      ),
    );

    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('ChatInputBar shows stop button when streaming', (tester) async {
    final controller = TextEditingController();
    bool stopped = false;

    await tester.pumpWidget(
      buildTestWidget(
        brightness: Brightness.light,
        child: ChatInputBar(
          controller: controller,
          onSend: () {},
          isStreaming: true,
          onStopStreaming: () => stopped = true,
          hintText: 'Test hint',
        ),
      ),
    );

    // The send icon shouldn't be there, instead a stop button (which is just a container inside an InkWell)
    expect(find.byIcon(Icons.arrow_upward_rounded), findsNothing);

    // Tap the stop button (it has a Tooltip 'Stop generating')
    await tester.tap(find.byTooltip('Stop generating'));
    expect(stopped, isTrue);
  });
}
