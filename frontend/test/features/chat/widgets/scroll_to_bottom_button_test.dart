import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/chat/widgets/scroll_to_bottom_button.dart';

void main() {
  testWidgets('ScrollToBottomButton renders correctly', (
    WidgetTester tester,
  ) async {
    var pressed = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ScrollToBottomButton(
            colors: AppThemeColors.dark(),
            onPressed: () {
              pressed = true;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byType(ScrollToBottomButton));
    expect(pressed, isTrue);
  });
}
